import {it,expect} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readJournalPage,copyJournal} from '../packages/toolchain/journal-reader';
import {ToolchainService} from '../packages/toolchain';
import {JournalPageSchema} from '../packages/contracts/compiler-journal';
it('rejects backwards, stalled, oversized and contradictory page responses',()=>{
 const page={text:'sample',offset:0,nextOffset:10,totalBytes:20,complete:false};expect(JournalPageSchema.safeParse(page).success).toBe(true);
 for(const invalid of [{...page,nextOffset:0},{...page,offset:15},{...page,nextOffset:21},{...page,complete:true},{...page,nextOffset:20},{...page,nextOffset:65537,totalBytes:65538}])expect(JournalPageSchema.safeParse(invalid).success).toBe(false);
 expect(JournalPageSchema.safeParse({text:'',offset:20,nextOffset:20,totalBytes:20,complete:true}).success).toBe(true);
});
async function fixture(fn:(root:string,path:string)=>Promise<void>){const root=await mkdtemp(join(tmpdir(),'jective-journal-reader-'));const folder=join(root,'build');await mkdir(folder);try{await fn(root,join(folder,'compiler.raw.log'));}finally{await rm(root,{recursive:true,force:true});}}
it('pages a long Cyrillic/emoji log without splitting its UTF-8 characters and exports exact bytes',async()=>fixture(async(root,path)=>{
 const text='x'.repeat(65535)+'Ж😀'+'z'.repeat(70000);await writeFile(path,text);
 const first=await readJournalPage(root,path,0);expect(first.text).toBe('x'.repeat(65535));expect(first.nextOffset).toBe(65535);expect(first.complete).toBe(false);
 let offset=first.nextOffset,combined=first.text;
 while(offset<first.totalBytes){const page=await readJournalPage(root,path,offset);expect(page.nextOffset).toBeGreaterThan(offset);combined+=page.text;offset=page.nextOffset;}
 expect(combined===text).toBe(true);const target=join(root,'export.log');await copyJournal(root,path,target);expect((await readFile(target)).equals(await readFile(path))).toBe(true);
 await expect(copyJournal(root,path,path)).rejects.toThrow('PROCESS_LOG_EXPORT_SAME_FILE');
}));
it('handles empty and malformed raw files while rejecting invalid offsets and unknown operations',async()=>fixture(async(root,path)=>{
 await writeFile(path,Buffer.from([0xe2,0x82]));expect((await readJournalPage(root,path,0)).text).toBe('\uFFFD');await expect(readJournalPage(root,path,3)).rejects.toThrow('PROCESS_LOG_OFFSET');await expect(readJournalPage(root,path,-1)).rejects.toThrow();await expect(readJournalPage(root,path,0.5)).rejects.toThrow();
 await writeFile(path,'');expect(await readJournalPage(root,path,0)).toEqual({text:'',offset:0,nextOffset:0,totalBytes:0,complete:true});
 const service=new ToolchainService('unused.exe',root);expect(()=>service.journalPage('00000000-0000-4000-8000-000000000000',0)).toThrow('PROCESS_LOG_UNAVAILABLE');expect(()=>service.exportJournal('../outside',path)).toThrow();
}));
it('rejects paths outside the toolchain, directories and redirected operation folders',async()=>fixture(async(root,path)=>{
 await writeFile(path,'private');const outside=await mkdtemp(join(tmpdir(),'jective-journal-outside-'));try{
  const file=join(outside,'outside.log');await writeFile(file,'unrelated');await expect(readJournalPage(root,file,0)).rejects.toThrow('PROCESS_LOG_UNSAFE');await expect(readJournalPage(root,join(root,'build'),0)).rejects.toThrow('PROCESS_LOG_UNSAFE');
  const linked=join(root,'redirect');await symlink(outside,linked,process.platform==='win32'?'junction':'dir');await expect(readJournalPage(root,join(linked,'outside.log'),0)).rejects.toThrow('PROCESS_LOG_UNSAFE');
 }finally{await rm(outside,{recursive:true,force:true});}
}));
