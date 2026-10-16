import {it,expect,vi} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {join,dirname,parse,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {importBundle,inspectBundleManifest} from '../packages/toolchain/bundle';

const fault=vi.hoisted(()=>({source:'',manifest:'',mode:'',fired:false,closed:false}));
vi.mock('node:fs/promises',async original=>{
 const fs=await original<typeof import('node:fs/promises')>();
 return {...fs,open:async(...args:Parameters<typeof fs.open>)=>{
  const file=await fs.open(...args);
  if(String(args[0])!==fault.source||!fault.mode)return file;
  const read=file.read.bind(file),close=file.close.bind(file);
  file.read=(async(...readArgs:Parameters<typeof file.read>)=>{
   const result=await read(...readArgs);
   if(!fault.fired){fault.fired=true;
    if(fault.mode==='read-error')throw Object.assign(new Error('EXPLICIT_READ_FAILURE'),{code:'EIO'});
    if(fault.mode==='source-change')await fs.writeFile(fault.source,Buffer.alloc(700000,66));
    if(fault.mode==='manifest-change')await fs.writeFile(fault.manifest,'{"not":"the reviewed manifest"}');
   }
   return result;
  }) as typeof file.read;
  file.close=async()=>{fault.closed=true;await close();};return file;
 }};
});
const core='data/packages/esp32/hardware/esp32/3.3.12/platform.txt',digest=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
async function setup(){
 const root=await mkdtemp(join(tmpdir(),'jective-stream-import-')),source=join(root,'source'),target=join(root,'target'),path=join(source,core),payload=Buffer.alloc(700000,65);
 await mkdir(dirname(path),{recursive:true});await writeFile(path,payload);await mkdir(target);await writeFile(join(target,'sentinel'),'keep original');
 const manifest={format:'jective-toolchain',version:1,cli:'1.5.1',core:'esp32:esp32@3.3.12',files:[{path:core,size:payload.length,sha256:digest(payload)}]},manifestPath=join(source,'jective-toolchain-manifest.json'),raw=JSON.stringify(manifest);await writeFile(manifestPath,raw);
 return {root,source,target,path,payload,manifest,manifestPath,raw};
}
async function cleanup(root:string){fault.mode='';fault.source='';fault.manifest='';fault.fired=false;fault.closed=false;if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-stream-import-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true});}

// Includes fsync and antivirus-visible writes under full-suite coverage load.
it('streams a multi-chunk file and publishes only exact hashed bytes plus the reviewed manifest',async()=>{
 const f=await setup();try{
  const review=await inspectBundleManifest(f.source);expect(review).toEqual({sha256:digest(Buffer.from(f.raw)),files:1,bytes:700000});
  const result=await importBundle(f.source,f.target,{expectedManifestHash:review.sha256});
  expect(await readFile(join(f.target,core))).toEqual(f.payload);expect(await readFile(join(f.target,'jective-toolchain-manifest.json'),'utf8')).toBe(f.raw);expect(await readFile(join(result.previous!,'sentinel'),'utf8')).toBe('keep original');
 }finally{await cleanup(f.root);}
},15000);
it('a changed reviewed manifest is rejected before any staging or target modification',async()=>{
 const f=await setup();try{const review=await inspectBundleManifest(f.source);await writeFile(f.manifestPath,f.raw+'\n');await expect(importBundle(f.source,f.target,{expectedManifestHash:review.sha256})).rejects.toThrow('TOOLCHAIN_MANIFEST_CHANGED');expect(await readdir(f.root)).toEqual(['source','target']);expect(await readFile(join(f.target,'sentinel'),'utf8')).toBe('keep original');}finally{await cleanup(f.root);}
});
it('a source changed during the stream cannot be installed, and read failures close handles and preserve the old target',async()=>{
 for(const mode of ['source-change','read-error']){
  const f=await setup();try{fault.source=f.path;fault.mode=mode;await expect(importBundle(f.source,f.target)).rejects.toThrow(mode==='source-change'?'TOOLCHAIN_HASH_MISMATCH':'EXPLICIT_READ_FAILURE');expect(fault.fired).toBe(true);expect(fault.closed).toBe(true);expect(await readFile(join(f.target,'sentinel'),'utf8')).toBe('keep original');expect(await readdir(f.root)).toEqual(['source','target']);}finally{await cleanup(f.root);}
 }
});
it('a source manifest changed after review cannot replace the exact parsed manifest in staging',async()=>{
 const f=await setup();try{fault.source=f.path;fault.manifest=f.manifestPath;fault.mode='manifest-change';await importBundle(f.source,f.target);expect(fault.fired).toBe(true);expect(await readFile(join(f.target,'jective-toolchain-manifest.json'),'utf8')).toBe(f.raw);expect(await readFile(f.manifestPath,'utf8')).not.toBe(f.raw);}finally{await cleanup(f.root);}
});
it('rejects Windows aliases, path ambiguity, overlarge totals and filesystem-root targets before publication',async()=>{
 const f=await setup();try{
  for(const path of ['data/NUL','data/AUX.txt','data/COM1','data/COM¹.txt','data/LPT2.log','data/file.','data/file ','data//file','data/a|b','data/a:b','data/../escape','data/a\\b','data/a\0b']){
   await writeFile(f.manifestPath,JSON.stringify({...f.manifest,files:[...f.manifest.files,{...f.manifest.files[0],path}]}));await expect(inspectBundleManifest(f.source)).rejects.toThrow('TOOLCHAIN_PATH_UNSAFE');
  }
  await writeFile(f.manifestPath,JSON.stringify({...f.manifest,files:Array.from({length:17},(_,index)=>({...f.manifest.files[0],path:index?`data/file-${index}`:core,size:1024**3}))}));await expect(inspectBundleManifest(f.source)).rejects.toThrow('TOOLCHAIN_BUNDLE_TOO_LARGE');
  await writeFile(f.manifestPath,f.raw);await expect(importBundle(f.source,parse(f.root).root)).rejects.toThrow('TOOLCHAIN_STAGING_UNSAFE');expect(await readdir(f.root)).toEqual(['source','target']);expect(await readFile(join(f.target,'sentinel'),'utf8')).toBe('keep original');
 }finally{await cleanup(f.root);}
});
it('accepts empty files and verify-only mode without creating an install destination',async()=>{
 const f=await setup();try{await writeFile(f.path,'');const empty={...f.manifest,files:[{path:core,size:0,sha256:digest(Buffer.alloc(0))}]};await writeFile(f.manifestPath,JSON.stringify(empty));const result=await importBundle(f.source,join(f.root,'not-created'),{verifyOnly:true});expect(result).toEqual({files:1,bytes:0,previous:null});expect(await readdir(f.root)).toEqual(['source','target']);}finally{await cleanup(f.root);}
});
