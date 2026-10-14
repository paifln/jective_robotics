import {mkdtemp,writeFile,lstat,rename,rm} from 'node:fs/promises';
import {join,resolve,dirname,basename} from 'node:path';
import {ProjectSchema,type Project} from '../contracts';
import {sourceEntries} from '../contracts/source-files';
function verifyTemporary(root:string,temporary:string){if(dirname(resolve(temporary))!==root||!basename(temporary).startsWith('.jective-export-'))throw new Error('EXPORT_TEMP_PATH');}
/** Publish a complete new Arduino folder; never merge into an existing export. */
export async function exportArduinoProject(value:Project,parent:string){
 const project=ProjectSchema.parse(value),root=resolve(parent),target=join(root,'jective_sketch');
 try{await lstat(target);throw new Error('EXPORT_EXISTS');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const temporary=await mkdtemp(join(root,'.jective-export-'));verifyTemporary(root,temporary);let published=false;
 try{
  for(const [name,text]of sourceEntries(project,'jective_sketch.ino'))await writeFile(join(temporary,name),text,{flag:'wx'});
  await rename(temporary,target);published=true;return target;
 }finally{
  if(!published){verifyTemporary(root,temporary);await rm(temporary,{recursive:true,force:true});}
 }
}
