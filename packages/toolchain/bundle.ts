import {z} from 'zod';
import {lstat,realpath,mkdir,writeFile,rename,rm} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {join,resolve,relative,isAbsolute,dirname,basename} from 'node:path';
import {readBoundedFile} from '../persistence/bounded-file';
import {verifyBundleFile} from './verified-copy';
import {parseJsonDocument} from '../contracts/json-document';

const Manifest=z.object({format:z.literal('jective-toolchain'),version:z.literal(1),cli:z.literal('1.5.1'),core:z.enum(['esp32:esp32@3.3.12','arduino:avr@1.8.8']),files:z.array(z.object({path:z.string().max(500),size:z.number().int().min(0).max(1024*1024*1024),sha256:z.string().regex(/^[a-f0-9]{64}$/)}).strict()).max(100000)}).strict();
const manifestName='jective-toolchain-manifest.json';

async function loadManifest(source:string){
 const root=await realpath(source),path=join(root,manifestName);
 if((await lstat(path)).isSymbolicLink())throw new Error('TOOLCHAIN_PATH_UNSAFE');
 const raw=await readBoundedFile(path,{maxBytes:32*1024*1024,tooLarge:'TOOLCHAIN_MANIFEST_TOO_LARGE',invalid:'TOOLCHAIN_PATH_UNSAFE',changed:'TOOLCHAIN_MANIFEST_CHANGED'});
 const manifest=Manifest.parse(parseJsonDocument(raw,'TOOLCHAIN_MANIFEST_INVALID')),seen=new Set<string>();let bytes=0;
 for(const file of manifest.files){
  const segments=file.path.split('/');
  if(!/^(data|user)\//.test(file.path)||file.path.includes('..')||file.path.includes('\\')||isAbsolute(file.path)||segments.some(segment=>!segment||/[\x00-\x1f<>:"|?*]/.test(segment)||/[. ]$/.test(segment)||/^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(?:\.|$)/i.test(segment))||seen.has(file.path.toLowerCase()))throw new Error('TOOLCHAIN_PATH_UNSAFE');
  seen.add(file.path.toLowerCase());bytes+=file.size;if(bytes>16*1024*1024*1024)throw new Error('TOOLCHAIN_BUNDLE_TOO_LARGE');
 }
 const [vendor,architecture,version]=manifest.core.split(/[:@]/);
 if(!seen.has(`data/packages/${vendor}/hardware/${architecture}/${version}/platform.txt`))throw new Error('TOOLCHAIN_CORE_MISSING');
 return {root,raw,manifest,bytes,sha256:createHash('sha256').update(raw).digest('hex')};
}

/** Metadata review only: the digest binds consent, it does not prove a trusted publisher. */
export async function inspectBundleManifest(source:string){
 const {sha256,manifest,bytes}=await loadManifest(source);return {sha256,files:manifest.files.length,bytes};
}

function verifyStagingPath(target:string,staged:string){
 if(!isAbsolute(target)||dirname(target)===target||dirname(staged)!==dirname(target)||!basename(staged).startsWith(basename(target)+'.import-')||!z.uuid().safeParse(basename(staged).slice(basename(target).length+8)).success)throw new Error('TOOLCHAIN_STAGING_UNSAFE');
}

export async function importBundle(source:string,target:string,options:{verifyOnly?:boolean;expectedManifestHash?:string}={}){
 const {root,raw,manifest,bytes,sha256}=await loadManifest(source);
 if(options.expectedManifestHash!==undefined&&options.expectedManifestHash!==sha256)throw new Error('TOOLCHAIN_MANIFEST_CHANGED');
 const destination=resolve(target),staged=destination+'.import-'+randomUUID();verifyStagingPath(destination,staged);
 try{
  if(!options.verifyOnly){await mkdir(dirname(staged),{recursive:true});await mkdir(staged,{recursive:false,mode:0o700});}
  for(const file of manifest.files){
   const path=resolve(root,file.path),actual=await realpath(path),rel=relative(root,actual);
   if(rel.startsWith('..')||isAbsolute(rel)||(await lstat(path)).isSymbolicLink())throw new Error('TOOLCHAIN_PATH_UNSAFE');
   const output=options.verifyOnly?undefined:join(staged,file.path);
   if(output)await mkdir(dirname(output),{recursive:true,mode:0o700});
   await verifyBundleFile(path,file,output);
  }
  if(options.verifyOnly)return {files:manifest.files.length,bytes,previous:null};
  await writeFile(join(staged,manifestName),raw,{flag:'wx',mode:0o600});
  let previous:string|null=null;
  try{await lstat(destination);previous=destination+'.previous-'+Date.now();await rename(destination,previous);}
  catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  try{await rename(staged,destination);}catch(error){if(previous)await rename(previous,destination);throw error;}
  return {files:manifest.files.length,bytes,previous};
 }catch(error){if(!options.verifyOnly){verifyStagingPath(destination,staged);await rm(staged,{recursive:true,force:true});}throw error;}
}
