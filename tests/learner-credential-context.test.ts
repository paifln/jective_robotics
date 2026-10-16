import {it,expect,vi} from 'vitest';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
vi.mock('electron',()=>({safeStorage:{isEncryptionAvailable:()=>true,encryptString:(text:string)=>Buffer.from('TEST ONLY '+text),decryptString:(bytes:Buffer)=>bytes.toString().replace('TEST ONLY ','')}}));
import {AssistantService,validateEndpoint} from '../packages/assistant';

it('endpoint canonicalization is idempotent before and after credential binding',()=>{for(const url of ['https://approved.example/','https://approved.example///','https://approved.example/v1///','http://127.0.0.1:8787//']){const canonical=validateEndpoint(url);expect(validateEndpoint(canonical)).toBe(canonical);}});

it('an edited local endpoint cannot redirect the stored learner credential to another server',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-credential-context-')),path=join(root,'assistant.json'),service=new AssistantService(path,true),token='jt_'+'t'.repeat(43);
 const transport=vi.spyOn(globalThis,'fetch').mockResolvedValue(Response.json({choices:[{message:{content:'EXPLICIT LOCAL TRANSPORT FIXTURE'},finish_reason:'stop'}]}));
 try{
  await service.configure({enabled:true,endpoint:'https://approved.example',model:'jective-managed',apiKey:token});
  const config=JSON.parse(await readFile(path,'utf8'));config.endpoint='https://untrusted.example';await writeFile(path,JSON.stringify(config));
  await expect(service.ask({question:'fixture',context:''})).rejects.toThrow('AI_CREDENTIAL_CONTEXT_CHANGED');expect(transport).not.toHaveBeenCalled();expect(service.cancel()).toBe(false);
  await service.configure({enabled:true,endpoint:'https://approved.example',model:'jective-managed',apiKey:token});expect(await service.ask({question:'approved request',context:''})).toBe('EXPLICIT LOCAL TRANSPORT FIXTURE');expect(transport).toHaveBeenCalledTimes(1);expect(transport.mock.calls[0]![0]).toBe('https://approved.example/chat/completions');expect(transport.mock.calls[0]![1]!.headers).toMatchObject({Authorization:'Bearer '+token});
 }finally{transport.mockRestore();if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-credential-context-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true});}
});

it('a legacy unbound token cannot be silently promoted to trusted endpoint-bound access',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-credential-context-')),path=join(root,'assistant.json'),service=new AssistantService(path,true),token='jt_'+'t'.repeat(43),raw=JSON.stringify({enabled:true,endpoint:'https://approved.example',model:'jective-managed',encryptedKey:Buffer.from('TEST ONLY '+token).toString('base64')});
 const transport=vi.spyOn(globalThis,'fetch').mockResolvedValue(Response.json({choices:[{message:{content:'EXPLICIT NO-NETWORK FIXTURE'},finish_reason:'stop'}]}));
 try{await writeFile(path,raw);await expect(service.ask({question:'fixture',context:''})).rejects.toThrow('AI_CREDENTIAL_REPROVISION_REQUIRED');expect(transport).not.toHaveBeenCalled();expect(await readFile(path,'utf8')).toBe(raw);}finally{transport.mockRestore();if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-credential-context-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true});}
});
