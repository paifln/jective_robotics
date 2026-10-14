import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect} from 'node:net';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAssistantServer,tokenHash} from '../services/assistant/server.mjs';
import {credentialRegistry} from '../services/assistant/policy.mjs';
import {readPrivateFile} from '../services/assistant/private-file.mjs';
import {serverConfig,startAssistant} from '../services/assistant/runtime.mjs';
import {sealProviderKey,openProviderKey} from '../services/assistant/secret-store.mjs';

const token='q'.repeat(43),credential={id:'test-learner',hash:tokenHash(token),expiresAt:'2099-01-01T00:00:00Z'};
const send=(port,body)=>fetch(`http://127.0.0.1:${port}/chat/completions`,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
const stop=async server=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));};

test('unfinished body hits absolute deadline, closes connection, releases concurrency and retains quota',{timeout:5000},async()=>{
 let calls=0;const logs=[];
 const server=createAssistantServer({providerKey:'fixture',model:'fixture',credentials:[credential],requestDeadlineMs:100,concurrency:1,dailyLimit:2,log:value=>logs.push(value),fetchImpl:async()=>{calls++;return Response.json({choices:[{message:{content:'fixture'}}]});}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let socket;
 try{
  const response=await new Promise((resolve,reject)=>{
   socket=connect(server.address().port,'127.0.0.1');let text='';socket.on('data',data=>{text+=data;});socket.on('error',reject);socket.on('close',()=>resolve(text));
   socket.on('connect',()=>socket.write('POST /chat/completions HTTP/1.1\r\nHost: localhost\r\nAuthorization: Bearer '+token+'\r\nContent-Type: application/json\r\nContent-Length: 100\r\n\r\n{'));
  });
  assert.match(response,/HTTP\/1.1 504/);assert.equal(calls,0);assert.equal(logs[0].status,504);
  const next=await send(server.address().port,{question:'valid',context:''});assert.equal(next.status,200);await next.json();assert.equal(calls,1);
  const limited=await send(server.address().port,{question:'valid',context:''});assert.equal(limited.status,429);await limited.json();assert.equal(calls,1);
 }finally{socket?.destroy();await stop(server);}
});

test('oversized bodies cannot invoke upstream; logging errors do not poison subsequent requests',{timeout:5000},async()=>{
 let calls=0;const server=createAssistantServer({providerKey:'fixture',model:'fixture',credentials:[credential],log:()=>{throw new Error('logger fixture');},fetchImpl:async()=>{calls++;return Response.json({choices:[{message:{content:'fixture'},finish_reason:'untrusted-provider-value'}]});}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const large=await send(server.address().port,{question:'q',context:'a'.repeat(210000)});assert.equal(large.status,413);await large.json();assert.equal(calls,0);
  const good=await send(server.address().port,{question:'q',context:''});assert.equal(good.status,200);assert.equal((await good.json()).choices[0].finish_reason,'stop');assert.equal(calls,1);
 }finally{await stop(server);}
});

test('credential registry rejects unknown fields and snapshots administrator objects',()=>{
 const value={...credential};const registry=credentialRegistry([value]);value.expiresAt='2000-01-01';assert.equal(registry.get(credential.hash).expiresAt,credential.expiresAt);
 assert.throws(()=>credentialRegistry([{...credential,token:'must-not-be-stored'}]));assert.throws(()=>credentialRegistry([credential,credential]));
});

test('bounded private file read rejects excess bytes before returning credentials',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-private-read-'));
 try{const path=join(root,'fixture');await writeFile(path,'12345',{mode:0o600});await assert.rejects(readPrivateFile(path,4));assert.equal((await readPrivateFile(path,5)).toString(),'12345');}
 finally{await rm(root,{recursive:true,force:true});}
});

test('runtime configuration rejects missing or overlapping paths and invalid limits',()=>{
 const env={ASSISTANT_SECRET_FILE:join(tmpdir(),'provider'),ASSISTANT_CREDENTIALS_FILE:join(tmpdir(),'credentials'),ASSISTANT_QUOTA_FILE:join(tmpdir(),'quota'),ASSISTANT_MODEL:'fixture'};
 assert.equal(serverConfig(env).port,8787);assert.throws(()=>serverConfig({...env,ASSISTANT_SECRET_FILE:'relative'}));assert.throws(()=>serverConfig({...env,ASSISTANT_QUOTA_FILE:env.ASSISTANT_SECRET_FILE}));assert.throws(()=>serverConfig({...env,ASSISTANT_CONCURRENCY:'0'}));assert.throws(()=>serverConfig({...env,PORT:'0'}));
});

test('provider failures and oversized streams are cancelled without returning metadata',{timeout:5000},async()=>{
 let cancelled=0,calls=0;
 const server=createAssistantServer({providerKey:'fixture',model:'fixture',credentials:[credential],log:()=>{},fetchImpl:async()=>{
  calls++;
  if(calls===1)return new Response(new ReadableStream({cancel(){cancelled++;}}),{status:500});
  return new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array(256001));},cancel(){cancelled++;}}));
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{for(let attempt=0;attempt<2;attempt++){const response=await send(server.address().port,{question:'q',context:''});assert.equal(response.status,502);const value=await response.json();assert.deepEqual(Object.keys(value),['error']);}assert.equal(cancelled,2);}
 finally{await stop(server);}
});

test('secret envelope rejects extra fields and byte limits account for Unicode',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-envelope-')),path=join(root,'provider.secret.json'),master='ab'.repeat(32);
 try{
  await assert.rejects(sealProviderKey(path,'Ж'.repeat(2001),master));
  await sealProviderKey(path,'fixture',master);const value=JSON.parse(await readFile(path,'utf8'));value.other='unexpected';await writeFile(path,JSON.stringify(value));await assert.rejects(openProviderKey(path,master));
 }finally{await rm(root,{recursive:true,force:true});}
});

test('production runtime loads encrypted key, clears secret environment and uses durable quotas',{timeout:5000},async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-runtime-test-'));let server;
 const env={ASSISTANT_SECRET_FILE:join(root,'provider.secret.json'),ASSISTANT_CREDENTIALS_FILE:join(root,'credentials.json'),ASSISTANT_QUOTA_FILE:join(root,'quota.sqlite'),ASSISTANT_MODEL:'fixture',ASSISTANT_MASTER_KEY_FILE:join(root,'master.key'),OPENAI_API_KEY:'unused-runtime-fixture'};
 try{
  await writeFile(env.ASSISTANT_MASTER_KEY_FILE,'a1'.repeat(32),{mode:0o600});await sealProviderKey(env.ASSISTANT_SECRET_FILE,'fixture-key','a1'.repeat(32));await writeFile(env.ASSISTANT_CREDENTIALS_FILE,JSON.stringify([credential]),{mode:0o600});
  // Runtime factory uses ephemeral port in this isolated test; production config never permits port zero.
  server=await startAssistant(options=>{assert.equal(options.providerKey,'fixture-key');assert.ok(options.quota);const instance=createAssistantServer({...options,log:()=>{},fetchImpl:async()=>Response.json({choices:[{message:{content:'runtime fixture'}}]})});const listen=instance.listen.bind(instance);instance.listen=(_port,host,callback)=>listen(0,host,callback);return instance;},env);
  assert.equal(env.ASSISTANT_MASTER_KEY,undefined);assert.equal(env.OPENAI_API_KEY,undefined);assert.equal(server.address().address,'127.0.0.1');
  const health=await fetch(`http://127.0.0.1:${server.address().port}/healthz`);assert.deepEqual(await health.json(),{status:'ready'});
  const response=await send(server.address().port,{question:'q',context:''});assert.equal(response.status,200);assert.ok(!(await readFile(env.ASSISTANT_SECRET_FILE,'utf8')).includes('fixture-key'));
 }finally{if(server)await stop(server);await rm(root,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
});
