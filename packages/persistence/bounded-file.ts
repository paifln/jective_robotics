import {open} from 'node:fs/promises';

type Snapshot={size:number;mtimeMs:number;ctimeMs:number;isFile():boolean};
export interface BoundedFileHandle {
 stat():Promise<Snapshot>;
 read(buffer:Buffer,offset:number,length:number,position:number):Promise<{bytesRead:number}>;
 close():Promise<void>;
}
export interface BoundedReadPolicy {maxBytes:number;tooLarge:string;invalid:string;changed:string}

/** Read a regular file through one handle. A prior path stat is not a memory bound. */
export function readBoundedFile(path:string,policy:BoundedReadPolicy){
 return readBoundedFileUsing(path,policy,target=>open(target,'r'));
}

export async function readBoundedFileUsing(path:string,policy:BoundedReadPolicy,openReader:(path:string)=>Promise<BoundedFileHandle>):Promise<Buffer>{
 if(!Number.isSafeInteger(policy.maxBytes)||policy.maxBytes<1||policy.maxBytes>64*1024*1024)throw new Error('FILE_READ_LIMIT_INVALID');
 const file=await openReader(path);
 try{
  const before=await file.stat();
  if(!before.isFile())throw new Error(policy.invalid);
  if(before.size>policy.maxBytes)throw new Error(policy.tooLarge);
  const bytes=Buffer.alloc(policy.maxBytes+1);let used=0;
  while(used<bytes.length){
   const {bytesRead}=await file.read(bytes,used,bytes.length-used,used);
   if(!bytesRead)break;used+=bytesRead;
  }
  if(used>policy.maxBytes)throw new Error(policy.tooLarge);
  const after=await file.stat();
  if(!after.isFile()||used!==before.size||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs)throw new Error(policy.changed);
  return bytes.subarray(0,used);
 }finally{await file.close();}
}
