import {open,lstat,realpath,copyFile} from 'node:fs/promises';
import {dirname,relative,isAbsolute} from 'node:path';
import {z} from 'zod';

import {JournalPageSchema,type JournalPage} from '../contracts/compiler-journal';
async function checkedPath(root:string,path:string){
 const base=await realpath(root),folder=dirname(path);
 for(const entry of [folder,path])if((await lstat(entry)).isSymbolicLink())throw new Error('PROCESS_LOG_UNSAFE');
 const actual=await realpath(path),within=relative(base,actual);
 if(!within||within.startsWith('..')||isAbsolute(within))throw new Error('PROCESS_LOG_UNSAFE');
 const file=await lstat(actual);if(!file.isFile()||file.size>64*1024*1024)throw new Error('PROCESS_LOG_UNSAFE');
 return actual;
}
/** Read only a small page into IPC. Offsets refer to original bytes, not JS characters. */
export async function readJournalPage(root:string,path:string,offset:unknown):Promise<JournalPage>{
 const start=z.number().int().min(0).max(64*1024*1024).parse(offset);
 const file=await open(await checkedPath(root,path),'r');
 try{
  const size=(await file.stat()).size;if(start>size)throw new Error('PROCESS_LOG_OFFSET');
  const buffer=Buffer.alloc(Math.min(65536,size-start));const {bytesRead}=await file.read(buffer,0,buffer.length,start);
  let length=bytesRead;
  // Keep a trailing split UTF-8 character for the next page. Malformed original
  // bytes remain untouched on disk/export, and display with replacement glyphs.
  if(start+length<size&&length){let lead=length-1;while(lead>=Math.max(0,length-4)&&(buffer[lead]!&0xc0)===0x80)lead--;if(lead>=0){const byte=buffer[lead]!,expected=byte>=0xf0&&byte<=0xf4?4:byte>=0xe0&&byte<=0xef?3:byte>=0xc2&&byte<=0xdf?2:1;if(expected>length-lead)length=lead;}}
  const nextOffset=start+length;
  return JournalPageSchema.parse({text:buffer.subarray(0,length).toString('utf8'),offset:start,nextOffset,totalBytes:size,complete:nextOffset===size});
 }finally{await file.close();}
}
export async function copyJournal(root:string,path:string,destination:string){
 const source=await checkedPath(root,path);
 if(source===await realpath(destination).catch(()=>destination))throw new Error('PROCESS_LOG_EXPORT_SAME_FILE');
 await copyFile(source,destination);
}
