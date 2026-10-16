import {constants,type BigIntStats} from 'node:fs';
import {lstat,open} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {readBoundedFile} from '../persistence/bounded-file';
import {parseJsonDocument} from '../contracts/json-document';

const maximumArtifactBytes=1024**3,maximumBuildBytes=4*1024**3;
export async function readBuildManifest(folder:string):Promise<unknown>{
 const code='BUILD_MANIFEST_INVALID';
 try{
  const bytes=await readBoundedFile(join(folder,'manifest.json'),{maxBytes:4*1024*1024,tooLarge:code,invalid:code,changed:code});
  return parseJsonDocument(bytes,code);
 }catch{throw new Error(code);}
}

export interface ArtifactReader{
 stat():Promise<BigIntStats>;
 read(buffer:Buffer,offset:number,length:number,position:number):Promise<{bytesRead:number}>;
 close():Promise<void>;
}
type ArtifactIO={lstat(path:string):Promise<BigIntStats>;open(path:string):Promise<ArtifactReader>};
const artifactIO:ArtifactIO={lstat:path=>lstat(path,{bigint:true}),open:async path=>{
 const handle=await open(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
 return {stat:()=>handle.stat({bigint:true}),read:(...args)=>handle.read(...args),close:()=>handle.close()};
}};

/** One physical handle, bounded memory, identity and mutation checks; no cached digest. */
export async function hashBuildArtifact(path:string,maxBytes=maximumArtifactBytes,io:ArtifactIO=artifactIO){
 if(!Number.isSafeInteger(maxBytes)||maxBytes<0||maxBytes>maximumArtifactBytes)throw new Error('ARTIFACT_CHANGED');
 try{
  const entry=await io.lstat(path);
  if(!entry.isFile()||entry.isSymbolicLink()||entry.size>BigInt(maxBytes))throw new Error('ARTIFACT_CHANGED');
  const file=await io.open(path);
  try{
   const before=await file.stat();
   if(!before.isFile()||before.size!==entry.size||before.ino!==entry.ino||before.dev!==entry.dev||before.mtimeNs!==entry.mtimeNs||before.ctimeNs!==entry.ctimeNs)throw new Error('ARTIFACT_CHANGED');
   const size=Number(before.size),hash=createHash('sha256'),buffer=Buffer.alloc(Math.min(256*1024,size+1));let bytes=0;
   while(bytes<=size){
    const result=await file.read(buffer,0,Math.min(buffer.length,size+1-bytes),bytes);
    if(!result.bytesRead)break;
    bytes+=result.bytesRead;if(bytes>size)throw new Error('ARTIFACT_CHANGED');
    hash.update(buffer.subarray(0,result.bytesRead));
   }
   const after=await file.stat(),current=await io.lstat(path);
   if(bytes!==size||after.size!==before.size||after.mtimeNs!==before.mtimeNs||after.ctimeNs!==before.ctimeNs||current.isSymbolicLink()||!current.isFile()||current.ino!==before.ino||current.dev!==before.dev||current.size!==before.size||current.mtimeNs!==before.mtimeNs||current.ctimeNs!==before.ctimeNs)throw new Error('ARTIFACT_CHANGED');
   return {bytes,sha256:hash.digest('hex')};
  }finally{await file.close();}
 }catch{throw new Error('ARTIFACT_CHANGED');}
}

export async function snapshotBuildArtifacts(output:string,names:string[]){
 if(names.length>256||new Set(names).size!==names.length)throw new Error('ARTIFACT_CHANGED');
 const hashes:Record<string,string>={},sizes:Record<string,number>={};let bytes=0;
 for(const name of names){
  if(name.length>200||!/^[a-zA-Z0-9_.-]+\.(bin|elf)$/.test(name))throw new Error('ARTIFACT_CHANGED');
  const file=await hashBuildArtifact(join(output,name),Math.min(maximumArtifactBytes,maximumBuildBytes-bytes));
  bytes+=file.bytes;hashes[name]=file.sha256;sizes[name]=file.bytes;
 }
 return {hashes,sizes};
}
