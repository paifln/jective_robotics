import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {prepareLocal} from '../services/assistant/setup-local.mjs';
import {openProviderKey} from '../services/assistant/secret-store.mjs';
import {startHosted,startRailway} from '../services/assistant/deploy/railway/start.mjs';
import {createAssistantServer} from '../services/assistant/server.mjs';
import {serverConfig} from '../services/assistant/runtime.mjs';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {removeFixtureDirectory} from './fixture-directory.node.mjs';

test('private local setup encrypts provider key, stores hash-only registry and never overwrites secrets',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-local-setup-')),data=join(root,'data'),master=join(root,'master');await mkdir(data);await mkdir(master);
 try{
  const result=await prepareLocal({data,master,model:'fixture',providerKey:'explicit-fake-provider'});
  const key=await readFile(join(master,'master.key'),'utf8');assert.equal(await openProviderKey(join(data,'provider.secret.json'),key),'explicit-fake-provider');
  const registry=await readFile(join(data,'credentials.json'),'utf8');assert.ok(!registry.includes(result.token));assert.match(result.token,/^jt_/);
  const ciphertext=await readFile(join(data,'provider.secret.json'),'utf8');assert.ok(!ciphertext.includes('explicit-fake-provider'));
  await assert.rejects(prepareLocal({data,master,model:'fixture',providerKey:'replacement'}));assert.equal(await readFile(join(data,'provider.secret.json'),'utf8'),ciphertext);
  await assert.rejects(prepareLocal({data:process.cwd(),master,model:'fixture',providerKey:'fixture'}));
 }finally{await removeFixtureDirectory(root);}
});

test('hosted runtime authenticates, keeps quotas across restarts, scrubs environment and uses only local upstream fixture',{timeout:10000},async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-hosted-check-')),data=join(root,'private'),master=join(root,'master'),quota=join(root,'persistent');for(const directory of [data,master,quota])await mkdir(directory);
 let server,calls=0;
 const stop=async()=>{if(server){server.closeAllConnections();await new Promise(done=>server.close(done));server=null;}};
 try{
  const issued=await prepareLocal({data,master,model:'fixture',providerKey:'explicit-fake-provider'});
  const initial={ASSISTANT_SEALED_PROVIDER_JSON:await readFile(join(data,'provider.secret.json'),'utf8'),ASSISTANT_MASTER_KEY:await readFile(join(master,'master.key'),'utf8'),ASSISTANT_CREDENTIALS_JSON:await readFile(join(data,'credentials.json'),'utf8'),ASSISTANT_MODEL:'fixture',ASSISTANT_DAILY_LIMIT:'1',ASSISTANT_GLOBAL_DAILY_LIMIT:'1'};
  const factory=options=>{assert.equal(options.providerKey,'explicit-fake-provider');const instance=createAssistantServer({...options,log:()=>{},fetchImpl:async()=>{calls++;return Response.json({choices:[{message:{content:'local fixture'}}]});}});const listen=instance.listen.bind(instance);instance.listen=(_port,host,callback)=>{assert.equal(host,'0.0.0.0');return listen(0,'127.0.0.1',callback);};return instance;};
  const env={...initial};server=await startHosted(env,quota,factory);for(const key of ['ASSISTANT_MASTER_KEY','ASSISTANT_SEALED_PROVIDER_JSON','ASSISTANT_CREDENTIALS_JSON'])assert.equal(env[key],undefined);
  const send=token=>fetch('http://127.0.0.1:'+server.address().port+'/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({question:'fixture',context:''})});
  const denied=await send('x'.repeat(43));assert.equal(denied.status,401);await denied.text();const good=await send(issued.token);assert.equal(good.status,200);await good.text();assert.equal(calls,1);
  await stop();server=await startHosted({...initial},quota,factory);const limited=await send(issued.token);assert.equal(limited.status,429);await limited.text();assert.equal(calls,1);assert.ok((await readdir(quota)).includes('quota.sqlite'));
  await assert.rejects(startHosted({...initial,ASSISTANT_MASTER_KEY:'0'.repeat(64)},quota,factory));
  assert.equal(serverConfig({ASSISTANT_SECRET_FILE:join(data,'a'),ASSISTANT_CREDENTIALS_FILE:join(data,'b'),ASSISTANT_QUOTA_FILE:join(data,'c'),ASSISTANT_MODEL:'fixture'}).host,'127.0.0.1');
  await assert.rejects(startRailway({RAILWAY_VOLUME_MOUNT_PATH:'/ephemeral'}));
 }finally{await stop();await removeFixtureDirectory(root);}
});

test('standalone local CLI starts from private configuration under Unicode paths without a provider request',{timeout:10000},async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective local CLI Қ ')),data=join(root,'private data'),master=join(root,'separate master');await mkdir(data);await mkdir(master);
 let child;
 try{
  const reservation=createServer();await new Promise(done=>reservation.listen(0,'127.0.0.1',done));const port=reservation.address().port;await new Promise(done=>reservation.close(done));
  await prepareLocal({data,master,model:'fixture',providerKey:'explicit-fake-local-cli-provider',port});
  const env={...process.env};for(const key of ['OPENAI_API_KEY','ASSISTANT_MASTER_KEY','ELECTRON_RUN_AS_NODE'])delete env[key];
  child=spawn(process.execPath,['services/assistant/setup-local.mjs','start',join(data,'runtime.json')],{env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let output='',errors='';child.stderr.on('data',bytes=>{errors+=bytes;});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Local CLI did not become ready')),5000);child.once('error',reject);child.once('exit',()=>{clearTimeout(timer);reject(new Error('Local CLI exited before readiness: '+errors));});child.stdout.on('data',bytes=>{output+=bytes;if(output.includes('listening on loopback')){clearTimeout(timer);resolve();}});});
  const ready=await fetch('http://127.0.0.1:'+port+'/healthz');assert.equal(ready.status,200);await ready.text();
  const denied=await fetch('http://127.0.0.1:'+port+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(denied.status,401);await denied.text();assert.ok(!output.includes('explicit-fake-local-cli-provider'));assert.ok(!errors.includes('explicit-fake-local-cli-provider'));
 }finally{if(child&&child.exitCode===null){const closed=once(child,'exit');child.kill();await closed;}await removeFixtureDirectory(root);}
});
