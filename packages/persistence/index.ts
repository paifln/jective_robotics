import {readBoundedFile} from './bounded-file';
import {replaceFileAtomically} from './atomic-file';
import {parseJsonDocument} from '../contracts/json-document';
import type {Project} from '../contracts';
import {validateStoredProject} from '../profiles/binding';
import {createHash} from 'node:crypto';
export const projectFileFingerprint=(bytes:string|Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
export async function readProjectSnapshot(path:string){const raw=await readBoundedFile(path,{maxBytes:2000000,tooLarge:'PROJECT_TOO_LARGE',invalid:'PROJECT_FILE_INVALID',changed:'PROJECT_CONFLICT'});return {project:validateStoredProject(parseJsonDocument(raw,'PROJECT_FORMAT')),fingerprint:projectFileFingerprint(raw)};}
export async function readProject(path:string){return (await readProjectSnapshot(path)).project;}
export async function writeProject(path:string,p:Project,expectedRevision:number|null,expectedFingerprint:string|null=null){
  const valid=validateStoredProject(p);
  const verify=async()=>{if(expectedRevision!==null){const current=await readProjectSnapshot(path);if(current.project.id!==p.id||current.project.revision!==expectedRevision||valid.revision!==expectedRevision||(expectedFingerprint!==null&&current.fingerprint!==expectedFingerprint))throw new Error('PROJECT_CONFLICT');}};
  await verify();
  const next={...valid,revision:valid.revision+1};const serialized=JSON.stringify(next,null,2);if(Buffer.byteLength(serialized)>2000000)throw new Error('PROJECT_TOO_LARGE');
  await replaceFileAtomically(path,serialized,verify);
  return next;
}
