import {open,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';

/** Bound allocation before reading administrator-owned credential files. */
export async function readPrivateFile(path,maxBytes){
 const entry=await lstat(path);
 if(!entry.isFile()||entry.isSymbolicLink()||entry.size>maxBytes)throw new Error('Invalid private file');
 const handle=await open(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
 try{
  const before=await handle.stat();
  if(!before.isFile()||before.size>maxBytes||before.ino!==entry.ino||before.dev!==entry.dev)throw new Error('Invalid private file');
  if(process.platform!=='win32'&&(before.mode&0o077))throw new Error('Private file permissions must be owner-only');
  const bytes=Buffer.alloc(maxBytes+1);let used=0;
  while(used<bytes.length){const result=await handle.read(bytes,used,bytes.length-used,used);if(!result.bytesRead)break;used+=result.bytesRead;}
  const after=await handle.stat();
  if(used>maxBytes||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs)throw new Error('Private file changed or exceeds limit');
  return bytes.subarray(0,used);
 }finally{await handle.close();}
}
