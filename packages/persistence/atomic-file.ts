import {open,rename,rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';

/** A unique exclusive sibling avoids following a predictable temporary-file link. */
export async function replaceFileAtomically(path:string,bytes:string|Uint8Array,beforeReplace:()=>Promise<void>=async()=>{}){
 const temporary=path+'.'+randomUUID()+'.tmp';
 let created=false;
 try{
  const file=await open(temporary,'wx',0o600);
  created=true;
  try{await file.writeFile(bytes);await file.sync();}finally{await file.close();}
  await beforeReplace();await rename(temporary,path);
 }finally{if(created)await rm(temporary,{force:true});}
}
