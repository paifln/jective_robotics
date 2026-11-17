import {createReadStream,type Stats} from 'node:fs';
import {lstat,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {EnvironmentProgress} from '../contracts/build-stage';
import {CoreSchema} from '../profiles';

export const EnvironmentSnapshotSchema=z.object({scope:z.literal('cli-selected-core-installed-tools-user-libraries-v2'),sha256:z.string().regex(/^[a-f0-9]{64}$/),files:z.number().int().min(1).max(100000),bytes:z.number().int().min(0).max(16*1024**3)}).strict();
export type EnvironmentSnapshot=z.infer<typeof EnvironmentSnapshotSchema>;
export type EnvironmentIO={createReadStream:typeof createReadStream;lstat:typeof lstat;readdir:typeof readdir};
export function snapshotEnvironment(executable:string,root:string,coreVersion:string,cancelled:()=>boolean=()=>false,onProgress?:(progress:EnvironmentProgress)=>void,core:z.infer<typeof CoreSchema>='esp32:esp32'):Promise<EnvironmentSnapshot>{
 return snapshotEnvironmentUsing(executable,root,coreVersion,cancelled,{createReadStream,lstat,readdir},onProgress,core);
}
/** Content hashing, never timestamp-only caching. Includes every installed package's tools, including SDKs. */
export async function snapshotEnvironmentUsing(executable:string,root:string,coreVersion:string,cancelled:()=>boolean,io:EnvironmentIO,onProgress?:(progress:EnvironmentProgress)=>void,core:z.infer<typeof CoreSchema>='esp32:esp32'):Promise<EnvironmentSnapshot>{
 const {createReadStream,lstat,readdir}=io;
 if(!/^\d+\.\d+\.\d+$/.test(coreVersion))throw new Error('CORE_VERSION_INVALID');
 const [vendor,architecture]=CoreSchema.parse(core).split(':') as [string,string];
 const hash=createHash('sha256').update('cli-selected-core-installed-tools-user-libraries-v2'),counts={files:0,bytes:0};
 const started=performance.now(),verified={files:0,bytes:0};let reportedAt=-Infinity;
 const progress=(final=false)=>{if(!onProgress)return;const now=performance.now();if(!final&&now-reportedAt<500)return;reportedAt=now;try{onProgress({...verified,elapsedMs:Math.round(now-started)});}catch{/* A presentation observer cannot invalidate or replace the content digest. */}};
 // Commit the deterministic preorder as soon as its next entry is ready. A slow
 // file may hold up only a bounded reorder window, never the entire SDK index.
 const entries=new Map<number,string>(),pending=new Set<Promise<void>>();let nextIndex=0,committed=0,failure:unknown;
 const reserve=()=>nextIndex++;
 const commit=(index:number,entry:string)=>{entries.set(index,entry);while(entries.has(committed)){hash.update(entries.get(committed)!);entries.delete(committed++);}};
 const append=(entry:string)=>commit(reserve(),entry);
 const drain=async()=>{await Promise.all(pending);if(failure)throw failure;};
 const visit=async(path:string,label:string,optional=false,depth=0,cached?:Stats):Promise<void>=>{
  if(cancelled())throw new Error('BUILD_INTERRUPTED');
  if(failure)throw failure;
  while(nextIndex-committed>=1024){await Promise.race(pending);if(failure)throw failure;if(cancelled())throw new Error('BUILD_INTERRUPTED');}
  if(depth>32)throw new Error('ENVIRONMENT_TOO_DEEP');
  let info;try{info=cached??await lstat(path);}catch(error){if(optional&&(error as NodeJS.ErrnoException).code==='ENOENT'){append(JSON.stringify([label,'absent']));return;}throw error;}
  if(info.isSymbolicLink())throw new Error('ENVIRONMENT_LINK_UNSUPPORTED');
  if(info.isDirectory()){
   append(JSON.stringify([label,'directory']));const names=(await readdir(path)).sort();
   for(let offset=0;offset<names.length;offset+=8){
    if(cancelled())throw new Error('BUILD_INTERRUPTED');if(failure)throw failure;
    const batch=names.slice(offset,offset+8),metadata=await Promise.allSettled(batch.map(name=>lstat(join(path,name))));
    // Fetch a small metadata batch concurrently, but visit and commit in exactly
    // the original sorted preorder. Never retain an entire SDK's stat objects.
    for(let i=0;i<batch.length;i++){const result=metadata[i]!;if(result.status==='rejected')throw result.reason;const name=batch[i]!;await visit(join(path,name),label+'/'+name,false,depth+1,result.value);}
   }
   return;
  }
  if(!info.isFile())throw new Error('ENVIRONMENT_FILE_UNSUPPORTED');
  counts.files++;counts.bytes+=info.size;if(counts.files>100000||info.size>1024**3||counts.bytes>16*1024**3)throw new Error('ENVIRONMENT_TOO_LARGE');
  const index=reserve();
  const task:Promise<void>=(async()=>{
   // Tiny SDK headers must not allocate a 256 KiB buffer (and another for EOF).
   // Bound nonempty reads to the observed size; the post-read stat still rejects
   // growth/shrinkage. Every byte is hashed anew, with at most eight open streams.
   const options={highWaterMark:Math.max(1,Math.min(256*1024,info.size)),...(info.size>0?{start:0,end:info.size-1}:{})};
   const digest=createHash('sha256');let bytes=0;for await(const chunk of createReadStream(path,options)){if(cancelled())throw new Error('BUILD_INTERRUPTED');bytes+=chunk.length;if(bytes>info.size)throw new Error('ENVIRONMENT_CHANGED_DURING_READ');digest.update(chunk);}
   const after=await lstat(path);if(bytes!==info.size||after.isSymbolicLink()||!after.isFile()||after.size!==info.size||after.mtimeMs!==info.mtimeMs||after.ctimeMs!==info.ctimeMs)throw new Error('ENVIRONMENT_CHANGED_DURING_READ');
   commit(index,JSON.stringify([label,info.size,digest.digest('hex')]));
   verified.files++;verified.bytes+=info.size;progress();
  })().catch(error=>{failure??=error;}).finally(()=>{pending.delete(task);});
  pending.add(task);
  // Fill whichever slot finishes first rather than waiting for a whole batch.
  if(pending.size>=8){await Promise.race(pending);if(failure)throw failure;}
 };
 const directoryChain=async(parts:string[],optional=false)=>{let path=root;for(const part of ['',...parts]){if(part)path=join(path,part);let info;try{info=await lstat(path);}catch(error){if(optional&&(error as NodeJS.ErrnoException).code==='ENOENT')return;throw error;}if(info.isSymbolicLink())throw new Error('ENVIRONMENT_LINK_UNSUPPORTED');if(!info.isDirectory())throw new Error('ENVIRONMENT_FILE_UNSUPPORTED');}};
 try{
 await directoryChain(['data','packages',vendor,'hardware',architecture,coreVersion]);await directoryChain(['user','libraries'],true);
 await visit(executable,'cli');await visit(join(root,'data','packages',vendor,'hardware',architecture,coreVersion),'core');await visit(join(root,'user','libraries'),'user-libraries',true);
 // Do not rely on an editable dependency list to decide which executables are trusted.
 // All installed tools are covered, including packages shared by several board variants.
 for(const packager of (await readdir(join(root,'data','packages'))).sort()){
  await directoryChain(['data','packages',packager,'tools'],true);
  await visit(join(root,'data','packages',packager,'tools'),'tools/'+packager,true);
 }
 await drain();if(entries.size||committed!==nextIndex)throw new Error('ENVIRONMENT_CHANGED_DURING_READ');progress(true);
 return EnvironmentSnapshotSchema.parse({scope:'cli-selected-core-installed-tools-user-libraries-v2',sha256:hash.digest('hex'),...counts});
 }finally{await Promise.all(pending);}
}
