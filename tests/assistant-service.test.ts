import {it,expect,vi} from 'vitest';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
const cryptoFixture=vi.hoisted(()=>({available:true}));
// Explicit test encryption adapter; these tests make no DPAPI/encryption-strength claim.
vi.mock('electron',()=>({safeStorage:{isEncryptionAvailable:()=>cryptoFixture.available,encryptString:(value:string)=>Buffer.from('TEST ONLY '+value),decryptString:(value:Buffer)=>value.toString().replace('TEST ONLY ','')}}));
import {AssistantService,validateEndpoint} from '../packages/assistant';
it('request deadline aborts transport without retry and releases the next request',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-assistant-deadline-')),service=new AssistantService(join(root,'assistant.json'),true);
 let started!:()=>void;const ready=new Promise<void>(resolve=>{started=resolve;});
 const transport=vi.spyOn(globalThis,'fetch').mockImplementationOnce((_input,options)=>new Promise<Response>((_resolve,reject)=>{
  const signal=options?.signal;if(!signal)throw new Error('MISSING_REQUEST_SIGNAL');
  signal.addEventListener('abort',()=>reject(new Error('EXPLICIT_ABORT_FIXTURE')),{once:true});started();
 })).mockResolvedValue(Response.json({choices:[{message:{content:'AFTER TIMEOUT FIXTURE'},finish_reason:'stop'}]}));
 try{
  await service.configure({enabled:true,endpoint:'https://assistant.example',model:'jective-managed',apiKey:'TEST_LEARNER_TOKEN'});
  vi.useFakeTimers();const pending=service.ask({question:'deadline fixture',context:''}).catch(error=>error as Error);await ready;
  await vi.advanceTimersByTimeAsync(44999);expect(transport.mock.calls[0]![1]!.signal!.aborted).toBe(false);
  await vi.advanceTimersByTimeAsync(1);const timedOut=await pending;if(!(timedOut instanceof Error))throw new Error('EXPECTED_TIMEOUT_ERROR');expect(timedOut.message).toBe('AI_INTERRUPTED_OR_TIMEOUT');expect(transport).toHaveBeenCalledTimes(1);expect(service.cancel()).toBe(false);
  vi.useRealTimers();expect(await service.ask({question:'manual new request',context:''})).toBe('AFTER TIMEOUT FIXTURE');expect(transport).toHaveBeenCalledTimes(2);
 }finally{vi.useRealTimers();service.cancel();transport.mockRestore();await rm(root,{recursive:true,force:true});}
});
it('cancellation and busy reservation apply before asynchronous configuration loading',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-assistant-early-cancel-')),service=new AssistantService(join(root,'assistant.json'),true);
 const transport=vi.spyOn(globalThis,'fetch').mockResolvedValue(Response.json({choices:[{message:{content:'EXPLICIT FIXTURE'},finish_reason:'stop'}]}));
 try{
  await service.configure({enabled:true,endpoint:'https://assistant.example',model:'jective-managed',apiKey:'TEST_LEARNER_TOKEN'});
  const pending=service.ask({question:'cancel before config resolves',context:''});
  const result=expect(pending).rejects.toThrow('AI_INTERRUPTED_OR_TIMEOUT');
  expect(service.cancel()).toBe(true);await expect(service.ask({question:'concurrent',context:''})).rejects.toThrow('AI_BUSY');await result;
  expect(transport).not.toHaveBeenCalled();expect(service.cancel()).toBe(false);
  expect(await service.ask({question:'next request',context:''})).toBe('EXPLICIT FIXTURE');expect(transport).toHaveBeenCalledTimes(1);
  await writeFile(service.path,'invalid');await expect(service.ask({question:'invalid config',context:''})).rejects.toThrow('AI_CONFIG_INVALID');expect(service.cancel()).toBe(false);
 }finally{service.cancel();transport.mockRestore();await rm(root,{recursive:true,force:true});}
});
it('student production mode refuses a legacy local provider key and uses only managed gateway payloads',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-managed-service-')),path=join(root,'assistant.json');
 const admin=new AssistantService(path),student=new AssistantService(path,true);
 const fetchFixture=vi.spyOn(globalThis,'fetch').mockResolvedValue(Response.json({choices:[{message:{content:'TEST GATEWAY ANSWER'},finish_reason:'stop'}]}));
 try{
  await admin.configure({enabled:true,endpoint:'https://api.openai.com/v1',model:'legacy-model',apiKey:'TEST_PROVIDER_SECRET'});
  expect(await student.settings()).toEqual({enabled:false,endpoint:'',model:'',keyConfigured:false});
  await expect(student.ask({question:'q',context:''})).rejects.toThrow('AI_DISABLED');expect(fetchFixture).not.toHaveBeenCalled();
  await admin.configure({enabled:true,endpoint:'https://assistant.example',model:'jective-managed',apiKey:'TEST_LEARNER_TOKEN'});
  expect(await student.ask({question:'q',context:'',history:[{role:'user',content:'earlier question'}]})).toBe('TEST GATEWAY ANSWER');
  expect(JSON.parse(String(fetchFixture.mock.calls[0]![1]?.body))).toEqual({question:'q',context:'',history:[{role:'user',content:'earlier question'}]});
 }finally{fetchFixture.mockRestore();await rm(root,{recursive:true,force:true});}
});
it('official OpenAI request uses the new bound and a truncated response fails without automatic retry',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-assistant-official-fixture-'));const service=new AssistantService(join(root,'config.json'));let truncated=true;
 const requests:{url:string;body:Record<string,unknown>}[]=[];
 // Explicit transport fixture: no external HTTP request or real credential.
 const transport=vi.spyOn(globalThis,'fetch').mockImplementation(async(input,options)=>{
  requests.push({url:String(input),body:JSON.parse(String(options?.body))});
  return new Response(JSON.stringify({choices:[{finish_reason:truncated?'length':'stop',message:{content:truncated?'INCOMPLETE TEST ANSWER':'COMPLETE TEST ANSWER'}}]}));
 });
 try{
  await service.configure({enabled:true,endpoint:'https://api.openai.com/v1',model:'unchanged-official-fixture',apiKey:'TEST_ONLY_KEY'});
  await expect(service.ask({question:'fixture',context:''})).rejects.toThrow('AI_RESPONSE_TRUNCATED');expect(requests).toHaveLength(1);
  expect(requests[0]!.url).toBe('https://api.openai.com/v1/chat/completions');expect(requests[0]!.body).toMatchObject({model:'unchanged-official-fixture',max_completion_tokens:1600});expect(requests[0]!.body).not.toHaveProperty('max_tokens');
  truncated=false;expect(await service.ask({question:'manual second fixture request',context:''})).toBe('COMPLETE TEST ANSWER');expect(requests).toHaveLength(2);
 }finally{transport.mockRestore();service.cancel();await rm(root,{recursive:true,force:true});}
});
it('concurrent configuration preserves the newly stored key and recovers after a failed update',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-assistant-concurrent-'));const path=join(root,'config.json');const service=new AssistantService(path);
 try{
  const updates=[service.configure({enabled:true,endpoint:'https://example.com',model:'first',apiKey:'fixture-concurrent-secret'})];
  for(let i=0;i<12;i++)updates.push(service.configure({enabled:true,endpoint:'https://example.com',model:'model-'+i}));
  await Promise.all(updates);
  expect(await service.settings()).toMatchObject({enabled:true,keyConfigured:true,model:'model-11'});
  expect(await readFile(path,'utf8')).not.toContain('fixture-concurrent-secret');
  await expect(service.configure({enabled:true,endpoint:'http://example.com',model:'rejected'})).rejects.toThrow('AI_ENDPOINT_REQUIRES_HTTPS_OR_LOCALHOST');
  await service.configure({enabled:true,endpoint:'https://example.com',model:'recovered'});
  expect(await service.settings()).toMatchObject({keyConfigured:true,model:'recovered'});
 }finally{await rm(root,{recursive:true,force:true});}
});
it('assistant defaults disabled, validates destinations, and preserves/clears explicitly mocked credentials appropriately',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-assistant-contract-'));const path=join(root,'config.json');const service=new AssistantService(path);
 try{
  expect(await service.settings()).toMatchObject({enabled:false,keyConfigured:false});await expect(service.ask({question:'fixture',context:''})).rejects.toThrow('AI_DISABLED');expect(service.cancel()).toBe(false);
  for(const url of ['https://u:p@example.com','https://example.com/#fragment','https://example.com/?q=x'])expect(()=>validateEndpoint(url)).toThrow('AI_ENDPOINT_INVALID');
  expect(()=>validateEndpoint('http://example.com')).toThrow('AI_ENDPOINT_REQUIRES_HTTPS_OR_LOCALHOST');expect(validateEndpoint('http://[::1]:1234/')).toBe('http://[::1]:1234');
  cryptoFixture.available=false;await expect(service.configure({enabled:true,endpoint:'https://example.com',model:'fixture',apiKey:'fixture-secret'})).rejects.toThrow('AI_SECURE_STORAGE_UNAVAILABLE');cryptoFixture.available=true;
  await service.configure({enabled:true,endpoint:'https://example.com',model:'fixture',apiKey:'fixture-secret'});expect((await service.settings()).keyConfigured).toBe(true);
  await service.configure({enabled:true,endpoint:'https://example.com',model:'changed'});expect((await service.settings()).keyConfigured).toBe(true);
  await service.configure({enabled:true,endpoint:'https://other.example.com',model:'changed'});expect((await service.settings()).keyConfigured).toBe(false);
  expect(await readFile(path,'utf8')).not.toContain('fixture-secret');
  await service.configure({enabled:false,endpoint:'https://other.example.com',model:'changed',apiKey:''});
  await writeFile(path,'invalid');await expect(service.settings()).rejects.toThrow('AI_CONFIG_INVALID');
 }finally{cryptoFixture.available=true;await rm(root,{recursive:true,force:true});}
});
it('actual local HTTP requests isolate supplied context, report bounded failures, reject concurrent requests and cancel',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-assistant-http-'));const service=new AssistantService(join(root,'config.json'));
 let mode='good';let requestBody='';let authorization:string|undefined;
 const server=createServer((request,response)=>{let body='';request.on('data',chunk=>body+=chunk);request.on('end',()=>{
  requestBody=body;authorization=request.headers.authorization;
  if(mode==='cancel')return;
  if(mode==='http'){response.writeHead(503);response.end('fixture');return;}
  if(mode==='redirect'){response.writeHead(302,{Location:'http://127.0.0.1:1/unfollowed'});response.end();return;}
  if(mode==='large'){response.writeHead(200,{'Content-Length':'256001'});response.end('x'.repeat(256001));return;}
  if(mode==='chunk'){response.writeHead(200,{'Transfer-Encoding':'chunked'});response.end('x'.repeat(256001));return;}
  response.end(mode==='bad'?'invalid JSON':JSON.stringify({choices:[{finish_reason:mode==='truncated'?'length':'stop',message:{content:mode==='empty'?' \n':'EXPLICIT TEST PROVIDER'}}]}));
 });});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();if(!address||typeof address==='string')throw new Error('No fixture listener');
 try{
  await service.configure({enabled:true,endpoint:`http://127.0.0.1:${address.port}`,model:'fixture',apiKey:'fixture-secret'});
  expect(await service.ask({question:'question fixture',context:'untrusted fixture'})).toBe('EXPLICIT TEST PROVIDER');expect(authorization).toBe('Bearer fixture-secret');expect(JSON.parse(requestBody).messages[1].content).toContain('BEGIN OPTIONAL PROJECT CONTEXT\nuntrusted fixture\nEND PROJECT CONTEXT');
  cryptoFixture.available=false;await expect(service.ask({question:'fixture',context:''})).rejects.toThrow('AI_SECURE_STORAGE_UNAVAILABLE');cryptoFixture.available=true;
  for(const [next,error] of [['http','AI_PROVIDER_HTTP_503'],['redirect','AI_REQUEST_FAILED'],['bad','AI_REQUEST_FAILED'],['large','AI_RESPONSE_TOO_LARGE'],['chunk','AI_RESPONSE_TOO_LARGE'],['truncated','AI_RESPONSE_TRUNCATED'],['empty','AI_EMPTY_RESPONSE']]){mode=next!;await expect(service.ask({question:'fixture',context:''})).rejects.toThrow(error!);}
  mode='cancel';requestBody='';const pending=service.ask({question:'fixture',context:''}).catch(error=>error);
  await vi.waitFor(()=>expect(requestBody).not.toBe(''));await expect(service.ask({question:'fixture',context:''})).rejects.toThrow('AI_BUSY');expect(service.cancel()).toBe(true);expect((await pending).message).toBe('AI_INTERRUPTED_OR_TIMEOUT');expect(service.cancel()).toBe(false);
  mode='good';expect(await service.ask({question:'fixture',context:''})).toBe('EXPLICIT TEST PROVIDER');
 }finally{cryptoFixture.available=true;service.cancel();server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(root,{recursive:true,force:true});}
});
