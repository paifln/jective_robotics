import {constants} from 'node:fs';
import {lstat,open} from 'node:fs/promises';
import {createHash} from 'node:crypto';

/** Hash exactly the bytes written to staging, using bounded memory and one source handle. */
export async function verifyBundleFile(path:string,expected:{size:number;sha256:string},destination?:string){
 const entry=await lstat(path);
 if(!entry.isFile()||entry.isSymbolicLink()||entry.size!==expected.size)throw new Error('TOOLCHAIN_HASH_MISMATCH');
 const source=await open(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
 try{
  const before=await source.stat();
  if(!before.isFile()||before.size!==expected.size||before.ino!==entry.ino||before.dev!==entry.dev)throw new Error('TOOLCHAIN_HASH_MISMATCH');
  const sink=destination?await open(destination,'wx',0o600):null;
  try{
   const hash=createHash('sha256'),buffer=Buffer.alloc(Math.min(256*1024,expected.size+1));let used=0;
   for(;;){
    const {bytesRead}=await source.read(buffer,0,Math.min(buffer.length,expected.size+1-used),used);
    if(!bytesRead)break;
    if(used+bytesRead>expected.size)throw new Error('TOOLCHAIN_HASH_MISMATCH');
    const chunk=buffer.subarray(0,bytesRead);hash.update(chunk);
    if(sink)await sink.writeFile(chunk);
    used+=bytesRead;
   }
   const after=await source.stat();
   if(used!==expected.size||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs||hash.digest('hex')!==expected.sha256)throw new Error('TOOLCHAIN_HASH_MISMATCH');
   await sink?.sync();
  }finally{await sink?.close();}
 }finally{await source.close();}
}
