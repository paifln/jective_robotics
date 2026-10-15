import {describe,it,expect,vi} from 'vitest';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {isLearnerCredential} from '../packages/contracts/learner-credential';
vi.mock('electron',()=>({safeStorage:{isEncryptionAvailable:()=>true,encryptString:(value:string)=>Buffer.from('TEST ONLY '+value),decryptString:(value:Buffer)=>value.toString().replace('TEST ONLY ','')}}));
import {AssistantService} from '../packages/assistant';

describe('managed learner credentials',()=>{
 it('accepts issued formats and refuses provider prefixes, wrong sizes and non-string values',()=>{
  for(const value of ['t'.repeat(43),'jt_'+ 'a'.repeat(43)])expect(isLearnerCredential(value)).toBe(true);
  for(const value of [undefined,null,{},'t'.repeat(42),'t'.repeat(44),'jt_'+ 'a'.repeat(42),'sk-'+ 'a'.repeat(40),'a'.repeat(42)+'!'])expect(isLearnerCredential(value)).toBe(false);
 });
 it('rejects provider configuration and provider keys before writing a student credential file',async()=>{
  const root=await mkdtemp(join(tmpdir(),'jective-token-policy-')),path=join(root,'assistant.json'),student=new AssistantService(path,true);
  try{
   await expect(student.configure({enabled:true,endpoint:'https://assistant.example',model:'provider-model',apiKey:'jt_'+ 't'.repeat(43)})).rejects.toThrow('AI_MANAGED_CONFIGURATION_REQUIRED');
   await expect(student.configure({enabled:true,endpoint:'https://assistant.example',model:'jective-managed',apiKey:'sk-proj-'+ 'x'.repeat(60)})).rejects.toThrow('AI_INVALID_LEARNER_TOKEN');
   await expect(readFile(path)).rejects.toHaveProperty('code','ENOENT');
  }finally{await rm(root,{recursive:true,force:true});}
 });
 it('refuses an invalid previously encrypted token without transport and releases the request slot',async()=>{
  const root=await mkdtemp(join(tmpdir(),'jective-token-read-')),path=join(root,'assistant.json'),student=new AssistantService(path,true);
  const transport=vi.spyOn(globalThis,'fetch').mockResolvedValue(Response.json({choices:[{message:{content:'MANAGED TOKEN FIXTURE'},finish_reason:'stop'}]}));
  try{
   await writeFile(path,JSON.stringify({enabled:true,endpoint:'https://assistant.example',model:'jective-managed',encryptedKey:Buffer.from('TEST ONLY INVALID_STORED_FIXTURE').toString('base64')}));
   await expect(student.ask({question:'q',context:''})).rejects.toThrow('AI_INVALID_LEARNER_TOKEN');expect(transport).not.toHaveBeenCalled();expect(student.cancel()).toBe(false);
   const token='jt_'+ 't'.repeat(43);await student.configure({enabled:true,endpoint:'https://assistant.example',model:'jective-managed',apiKey:token});await student.configure({enabled:true,endpoint:'https://assistant.example',model:'jective-managed'});expect((await student.settings()).keyConfigured).toBe(true);expect(await student.ask({question:'q',context:''})).toBe('MANAGED TOKEN FIXTURE');expect(transport.mock.calls[0]![1]!.headers).toMatchObject({Authorization:'Bearer '+token});
  }finally{transport.mockRestore();await rm(root,{recursive:true,force:true});}
 });
 it('never promotes a legacy provider credential when the managed model is selected',async()=>{
  const root=await mkdtemp(join(tmpdir(),'jective-token-migration-')),path=join(root,'assistant.json'),admin=new AssistantService(path),student=new AssistantService(path,true);
  const transport=vi.spyOn(globalThis,'fetch');
  try{
   await admin.configure({enabled:true,endpoint:'https://assistant.example',model:'legacy-provider',apiKey:'TEST_PROVIDER_FIXTURE'});
   await student.configure({enabled:true,endpoint:'https://assistant.example',model:'jective-managed'});expect(JSON.parse(await readFile(path,'utf8')).encryptedKey).toBe('');expect((await student.settings()).keyConfigured).toBe(false);await expect(student.ask({question:'q',context:''})).rejects.toThrow('AI_INVALID_LEARNER_TOKEN');expect(transport).not.toHaveBeenCalled();
   await student.configure({enabled:false,endpoint:'https://assistant.example',model:'jective-managed',apiKey:''});await expect(student.ask({question:'q',context:''})).rejects.toThrow('AI_DISABLED');
  }finally{transport.mockRestore();await rm(root,{recursive:true,force:true});}
 });
});
