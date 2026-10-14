import {readFile,open,stat,rename,rm} from 'node:fs/promises';
import type {Project} from '../contracts';
import {validateStoredProject} from '../profiles/binding';
import {randomUUID,createHash} from 'node:crypto';
export const projectFileFingerprint=(bytes:string|Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
export async function readProjectSnapshot(path:string){if((await stat(path)).size>2000000)throw new Error('PROJECT_TOO_LARGE');const raw=await readFile(path);if(raw.length>2000000)throw new Error('PROJECT_TOO_LARGE');return {project:validateStoredProject(JSON.parse(raw.toString('utf8'))),fingerprint:projectFileFingerprint(raw)};}
export async function readProject(path:string){return (await readProjectSnapshot(path)).project;}
export async function writeProject(path:string,p:Project,expectedRevision:number|null,expectedFingerprint:string|null=null){
  const valid=validateStoredProject(p);
  const verify=async()=>{if(expectedRevision!==null){const current=await readProjectSnapshot(path);if(current.project.id!==p.id||current.project.revision!==expectedRevision||valid.revision!==expectedRevision||(expectedFingerprint!==null&&current.fingerprint!==expectedFingerprint))throw new Error('PROJECT_CONFLICT');}};
  await verify();
  const next={...valid,revision:valid.revision+1};const serialized=JSON.stringify(next,null,2);if(Buffer.byteLength(serialized)>2000000)throw new Error('PROJECT_TOO_LARGE');const temporary=path+'.'+randomUUID()+'.tmp';
  try{const file=await open(temporary,'wx');try{await file.writeFile(serialized,'utf8');await file.sync();}finally{await file.close();}await verify();await rename(temporary,path);}finally{await rm(temporary,{force:true});}
  return next;
}
