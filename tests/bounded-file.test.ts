import {it,expect} from 'vitest';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';
import {join,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {readBoundedFile,readBoundedFileUsing,type BoundedFileHandle} from '../packages/persistence/bounded-file';

const policy={maxBytes:16,tooLarge:'TEST_TOO_LARGE',invalid:'TEST_INVALID',changed:'TEST_CHANGED'};
it('bounds real regular-file reads, preserves UTF-8 bytes, and rejects missing, oversized and directory inputs',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-bounded-file-'));
 try{
  const path=join(root,'Привет.json');await writeFile(path,'Привет');expect((await readBoundedFile(path,policy)).toString()).toBe('Привет');
  await writeFile(path,Buffer.alloc(17));await expect(readBoundedFile(path,policy)).rejects.toThrow('TEST_TOO_LARGE');
  await expect(readBoundedFile(join(root,'missing'),policy)).rejects.toThrow();
  const directory=join(root,'directory');await mkdir(directory);await expect(readBoundedFile(directory,policy)).rejects.toThrow();
 }finally{if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-bounded-file-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true});}
});
it('caps allocation when a file grows after its first handle stat and always closes the handle',async()=>{
 let closed=0,maximumRequested=0;
 const file:BoundedFileHandle={stat:async()=>({size:1,mtimeMs:1,ctimeMs:1,isFile:()=>true}),read:async(buffer,offset,length)=>{maximumRequested=Math.max(maximumRequested,length);buffer.fill(120,offset,offset+length);return {bytesRead:length};},close:async()=>{closed++;}};
 await expect(readBoundedFileUsing('fixture',policy,async()=>file)).rejects.toThrow('TEST_TOO_LARGE');expect(maximumRequested).toBe(17);expect(closed).toBe(1);
});
it('reads short chunks from one handle and rejects shrinkage or metadata changes during reading',async()=>{
 for(const mutation of ['none','size','mtime','ctime','kind','short'] as const){
  let stats=0,closed=0,reads=0;
  const file:BoundedFileHandle={
   stat:async()=>{stats++;const after=stats>1;return {size:after&&mutation==='size'?3:4,mtimeMs:after&&mutation==='mtime'?2:1,ctimeMs:after&&mutation==='ctime'?2:1,isFile:()=>!(after&&mutation==='kind')};},
   read:async(buffer,offset)=>{reads++;const bytesRead=reads<=(mutation==='short'?1:2)?2:0;buffer.fill(65,offset,offset+bytesRead);return {bytesRead};},
   close:async()=>{closed++;}
  };
  const result=readBoundedFileUsing('fixture',policy,async()=>file);
  if(mutation==='none')expect((await result).toString()).toBe('AAAA');else await expect(result).rejects.toThrow('TEST_CHANGED');expect(closed).toBe(1);
 }
});
it('validates limits before opening and closes after stat/read failures or a non-file response',async()=>{
 for(const maxBytes of [0,-1,NaN,Infinity,1.5,64*1024*1024+1])await expect(readBoundedFileUsing('fixture',{...policy,maxBytes},async()=>{throw new Error('OPEN_SHOULD_NOT_RUN');})).rejects.toThrow('FILE_READ_LIMIT_INVALID');
 for(const failure of ['stat','read','kind'] as const){
  let closed=false;const file:BoundedFileHandle={stat:async()=>{if(failure==='stat')throw new Error('STAT_FAILURE');return {size:0,mtimeMs:0,ctimeMs:0,isFile:()=>failure!=='kind'};},read:async()=>{throw new Error('READ_FAILURE');},close:async()=>{closed=true;}};
  await expect(readBoundedFileUsing('fixture',policy,async()=>file)).rejects.toThrow(failure==='kind'?'TEST_INVALID':failure==='stat'?'STAT_FAILURE':'READ_FAILURE');expect(closed).toBe(true);
 }
});
