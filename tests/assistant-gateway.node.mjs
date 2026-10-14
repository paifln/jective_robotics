import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAssistantServer,tokenHash} from '../services/assistant/server.mjs';
import {sealProviderKey,openProviderKey} from '../services/assistant/secret-store.mjs';
import {QuotaStore} from '../services/assistant/quota-store.mjs';

test('disconnect aborts upstream, releases concurrency and still consumes its quota reservation',{timeout:5000},async()=>{
 const token='d'.repeat(43);let calls=0,started,settled;
 const ready=new Promise(resolve=>{started=resolve;}),released=new Promise(resolve=>{settled=resolve;});
 const server=createAssistantServer({providerKey:'DISCONNECT_FIXTURE_SECRET',model:'fixture',credentials:[{id:'disconnect-learner',hash:tokenHash(token),expiresAt:'2099-01-01T00:00:00Z'}],concurrency:1,dailyLimit:2,log:entry=>{if(entry.status===504)settled();},fetchImpl:async(_url,options)=>{
  calls++;if(calls>1)return Response.json({choices:[{message:{content:'NEXT FIXTURE'},finish_reason:'stop'}]});
  return new Promise((_resolve,reject)=>{options.signal.addEventListener('abort',()=>reject(new Error('EXPLICIT_UPSTREAM_ABORT')),{once:true});started();});
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const controller=new AbortController(),url=`http://127.0.0.1:${server.address().port}/chat/completions`;
 const options={method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({question:'disconnect fixture',context:''})};
 try{
  const pending=fetch(url,{...options,signal:controller.signal}).catch(error=>error);await ready;controller.abort();assert.equal((await pending).name,'AbortError');await released;
  assert.equal(calls,1);const next=await fetch(url,options);assert.equal(next.status,200);await next.json();assert.equal(calls,2);
  const limited=await fetch(url,options);assert.equal(limited.status,429);await limited.json();assert.equal(calls,2);
 }finally{controller.abort();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

test('durable quotas survive restart and enforce total across learner identities and connections',async()=>{
  const root=await mkdtemp(join(tmpdir(),'jective-quota-test-')),path=join(root,'quota.sqlite'),now=Date.parse('2026-10-13T10:00:00Z');
  let first,second;
  try{
    first=new QuotaStore(path);assert.equal(first.reserve('learner-1',2,3,now),true);first.close();first=undefined;
    second=new QuotaStore(path);assert.equal(second.reserve('learner-1',2,3,now),true);assert.equal(second.reserve('learner-1',2,3,now),false);
    first=new QuotaStore(path);assert.equal(first.reserve('learner-2',2,3,now),true);assert.equal(second.reserve('learner-3',2,3,now),false);
    assert.equal(first.reserve('learner-1',2,3,now+86400000),true);
  }finally{first?.close();second?.close();await rm(root,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
});

test('provider credential is encrypted and authenticated, wrong master and tampering fail',async()=>{
  const root=await mkdtemp(join(tmpdir(),'jective-secret-test-')),path=join(root,'provider.secret.json'),key='ab'.repeat(32);
  try{
    await sealProviderKey(path,'fixture-provider-secret',key);
    const bytes=await readFile(path,'utf8');assert.ok(!bytes.includes('fixture-provider-secret'));
    assert.equal(await openProviderKey(path,key),'fixture-provider-secret');
    await assert.rejects(openProviderKey(path,'cd'.repeat(32)));
    await assert.rejects(sealProviderKey(path,'replacement',key));
    const data=JSON.parse(bytes);data.encrypted=(data.encrypted.startsWith('00')?'01':'00')+data.encrypted.slice(2);await writeFile(path,JSON.stringify(data));
    await assert.rejects(openProviderKey(path,key));
  }finally{await rm(root,{recursive:true,force:true});}
});

test('gateway authenticates, enforces server model and quota, strips upstream metadata and never logs content or secrets',async()=>{
  const token='x'.repeat(43),requests=[],logs=[];
  const server=createAssistantServer({providerKey:'fixture-provider-secret',model:'fixture-server-model',credentials:[{id:'learner-1',hash:tokenHash(token),expiresAt:'2099-01-01T00:00:00Z'}],dailyLimit:2,log:entry=>logs.push(entry),fetchImpl:async(url,options)=>{requests.push({url,options});return Response.json({id:'private-provider-id',choices:[{message:{content:'Try a shorter wait.'},finish_reason:'stop'}]});}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/chat/completions`;
  const send=(value,authorization=token,extra={})=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+authorization,...extra},body:JSON.stringify(value)});
  try{
    assert.equal((await send({question:'q',context:''},'bad')).status,401);
    assert.equal((await send({question:'q',context:''},token,{Origin:'https://untrusted.example'})).status,404);
    assert.equal((await send({question:'private learner question',context:'private code',model:'client-selected-model'})).status,400);
    const response=await send({question:'private learner question',context:'private code'});assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{choices:[{message:{content:'Try a shorter wait.'},finish_reason:'stop'}]});
    assert.equal((await send({question:'q',context:''})).status,429);
    assert.equal(requests.length,1);assert.equal(requests[0].url,'https://api.openai.com/v1/chat/completions');
    assert.equal(JSON.parse(requests[0].options.body).model,'fixture-server-model');
    for(const secret of [token,'fixture-provider-secret','private learner question','private code'])assert.ok(!JSON.stringify(logs).includes(secret));
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

test('expired learner credentials never invoke the provider',async()=>{
  const token='z'.repeat(43);let called=false;
  const server=createAssistantServer({providerKey:'fixture',model:'fixture',credentials:[{id:'expired',hash:tokenHash(token),expiresAt:'2000-01-01T00:00:00Z'}],log:()=>{},fetchImpl:async()=>{called=true;throw new Error('should not run');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{const response=await fetch(`http://127.0.0.1:${server.address().port}/chat/completions`,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});assert.equal(response.status,401);assert.equal(called,false);}
  finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
