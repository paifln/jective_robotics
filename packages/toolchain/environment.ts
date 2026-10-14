import {createReadStream} from 'node:fs';
import {lstat,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {z} from 'zod';

export const EnvironmentSnapshotSchema=z.object({scope:z.literal('cli-selected-core-installed-tools-user-libraries-v2'),sha256:z.string().regex(/^[a-f0-9]{64}$/),files:z.number().int().min(1).max(100000),bytes:z.number().int().min(0).max(16*1024**3)}).strict();
export type EnvironmentSnapshot=z.infer<typeof EnvironmentSnapshotSchema>;
export type EnvironmentIO={createReadStream:typeof createReadStream;lstat:typeof lstat;readdir:typeof readdir};
export function snapshotEnvironment(executable:string,root:string,coreVersion:string,cancelled:()=>boolean=()=>false):Promise<EnvironmentSnapshot>{
 return snapshotEnvironmentUsing(executable,root,coreVersion,cancelled,{createReadStream,lstat,readdir});
}
/** Content hashing, never timestamp-only caching. Includes every installed package's tools, including SDKs. */
export async function snapshotEnvironmentUsing(executable:string,root:string,coreVersion:string,cancelled:()=>boolean,io:EnvironmentIO):Promise<EnvironmentSnapshot>{
 const {createReadStream,lstat,readdir}=io;
 if(!/^\d+\.\d+\.\d+$/.test(coreVersion))throw new Error('CORE_VERSION_INVALID');
 const hash=createHash('sha256').update('cli-selected-core-installed-tools-user-libraries-v2'),counts={files:0,bytes:0};
 const entries:string[]=[],pending=new Set<Promise<void>>();let failure:unknown;
 const drain=async()=>{await Promise.all(pending);if(failure)throw failure;};
 const visit=async(path:string,label:string,optional=false,depth=0):Promise<void>=>{
  if(cancelled())throw new Error('BUILD_INTERRUPTED');
  if(failure)throw failure;
  if(depth>32)throw new Error('ENVIRONMENT_TOO_DEEP');
  let info;try{info=await lstat(path);}catch(error){if(optional&&(error as NodeJS.ErrnoException).code==='ENOENT'){entries.push(JSON.stringify([label,'absent']));return;}throw error;}
  if(info.isSymbolicLink())throw new Error('ENVIRONMENT_LINK_UNSUPPORTED');
  if(info.isDirectory()){entries.push(JSON.stringify([label,'directory']));for(const name of (await readdir(path)).sort())await visit(join(path,name),label+'/'+name,false,depth+1);return;}
  if(!info.isFile())throw new Error('ENVIRONMENT_FILE_UNSUPPORTED');
  counts.files++;counts.bytes+=info.size;if(counts.files>100000||info.size>1024**3||counts.bytes>16*1024**3)throw new Error('ENVIRONMENT_TOO_LARGE');
  const index=entries.push('')-1;
  const task:Promise<void>=(async()=>{
   // Larger bounded chunks reduce read-call overhead for multi-gigabyte SDK trees.
   // At most eight streams are active; hash order and file mutation checks stay identical.
   const digest=createHash('sha256');let bytes=0;for await(const chunk of createReadStream(path,{highWaterMark:256*1024})){if(cancelled())throw new Error('BUILD_INTERRUPTED');bytes+=chunk.length;if(bytes>info.size)throw new Error('ENVIRONMENT_CHANGED_DURING_READ');digest.update(chunk);}
   const after=await lstat(path);if(bytes!==info.size||after.isSymbolicLink()||!after.isFile()||after.size!==info.size||after.mtimeMs!==info.mtimeMs||after.ctimeMs!==info.ctimeMs)throw new Error('ENVIRONMENT_CHANGED_DURING_READ');
   entries[index]=JSON.stringify([label,info.size,digest.digest('hex')]);
  })().catch(error=>{failure??=error;}).finally(()=>{pending.delete(task);});
  pending.add(task);
  // Fill whichever slot finishes first rather than waiting for a whole batch.
  if(pending.size>=8){await Promise.race(pending);if(failure)throw failure;}
 };
 const directoryChain=async(parts:string[],optional=false)=>{let path=root;for(const part of ['',...parts]){if(part)path=join(path,part);let info;try{info=await lstat(path);}catch(error){if(optional&&(error as NodeJS.ErrnoException).code==='ENOENT')return;throw error;}if(info.isSymbolicLink())throw new Error('ENVIRONMENT_LINK_UNSUPPORTED');if(!info.isDirectory())throw new Error('ENVIRONMENT_FILE_UNSUPPORTED');}};
 try{
 await directoryChain(['data','packages','esp32','hardware','esp32',coreVersion]);await directoryChain(['user','libraries'],true);
 await visit(executable,'cli');await visit(join(root,'data','packages','esp32','hardware','esp32',coreVersion),'core');await visit(join(root,'user','libraries'),'user-libraries',true);
 // Do not rely on an editable dependency list to decide which executables are trusted.
 // All installed tools are covered, including packages shared by several board variants.
 for(const packager of (await readdir(join(root,'data','packages'))).sort()){
  await directoryChain(['data','packages',packager,'tools'],true);
  await visit(join(root,'data','packages',packager,'tools'),'tools/'+packager,true);
 }
 await drain();for(const entry of entries)hash.update(entry);
 return EnvironmentSnapshotSchema.parse({scope:'cli-selected-core-installed-tools-user-libraries-v2',sha256:hash.digest('hex'),...counts});
 }finally{await Promise.all(pending);}
}
