import {readFile,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {Project} from '../contracts';
import {sourceEntries} from '../contracts/source-files';
/** Upload must use an intact, source-matched build snapshot, including headers. */
export async function verifySourceSnapshot(folder:string,project:Project){
 const manifest=z.object({sourceFileHashes:z.record(z.string().max(80),z.string().regex(/^[a-f0-9]{64}$/)).refine(files=>Object.keys(files).length<=16)}).parse(JSON.parse(await readFile(join(folder,'manifest.json'),'utf8')));
 const entries=sourceEntries(project);if(Object.keys(manifest.sourceFileHashes).length!==entries.length)throw new Error('SOURCE_FILE_CHANGED');
 for(const [name,text]of entries){
  const expected=createHash('sha256').update(text).digest('hex');if(manifest.sourceFileHashes[name]!==expected)throw new Error('SOURCE_FILE_CHANGED');
  const file=join(folder,'sketch',name);let valid=false;try{const stat=await lstat(file);valid=stat.isFile()&&!stat.isSymbolicLink()&&stat.size===Buffer.byteLength(text);}catch{/* A missing or replaced source is an invalid build snapshot. */}
  if(!valid||createHash('sha256').update(await readFile(file)).digest('hex')!==expected)throw new Error('SOURCE_FILE_CHANGED');
 }
}
