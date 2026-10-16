import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {mkdir,mkdtemp,readdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sealProviderKey} from '../services/assistant/secret-store.mjs';
import {tokenHash} from '../services/assistant/policy.mjs';

// No Railway login, real API key, networked container, installer or hardware.
const repository=fileURLToPath(new URL('..',import.meta.url));
const temporary=await mkdtemp(join(tmpdir(),'jective-assistant-container-'));
const id='jective-assistant-check-'+randomUUID(),image=id+':local';
const report={startedAt:new Date().toISOString(),scope:'Local Linux Docker, synthetic credentials, disabled container networking. Not Railway, HTTPS or provider verification.',status:'RUNNING',checks:[]};
const ownedContainers=new Set(),ownedVolumes=new Set();let built=false;

function docker(args,{allowFailure=false,timeout=60000}={}){
 const result=spawnSync('docker',args,{encoding:'utf8',windowsHide:true,timeout,maxBuffer:2*1024*1024});
 if(result.error)throw result.error;
 if(result.status!==0&&!allowFailure)throw new Error('Docker '+args[0]+' failed: '+result.stderr);
 return result;
}
const json=code=>['node','--input-type=module','-e',code];
function inspect(container,code){return JSON.parse(docker(['exec',container,...json(code)]).stdout.trim());}
async function ready(container){
 for(let attempt=0;attempt<30;attempt++){
  const result=docker(['exec',container,...json("const r=await fetch('http://127.0.0.1:8787/healthz');console.log(r.status)")],{allowFailure:true});
  if(result.status===0&&result.stdout.trim()==='200')return;
  await new Promise(done=>setTimeout(done,200));
 }
 throw new Error('Container readiness failed');
}
function createVolume(name){
 const existing=docker(['volume','inspect',name],{allowFailure:true});assert.notEqual(existing.status,0,'Refusing to reuse another volume');
 docker(['volume','create',name]);ownedVolumes.add(name);
}
function launch(name,volume,environment,fixture){
 const args=['run','--detach','--name',name,'--network','none','--env-file',environment,'--mount','type=volume,source='+volume+',target=/data'];
 if(fixture)args.push('--mount','type=bind,source='+fixture+',target=/app/fixture.mjs,readonly');
 args.push(image);if(fixture)args.push('node','/app/fixture.mjs');
 const container=docker(args).stdout.trim();assert.match(container,/^[a-f0-9]{64}$/);ownedContainers.add(container);return container;
}

try{
 const context=join(temporary,'context'),server=join(context,'services/assistant');await mkdir(join(server,'deploy/railway'),{recursive:true});
 const sources=(await readdir(join(repository,'services/assistant'))).filter(name=>name.endsWith('.mjs')).map(name=>'services/assistant/'+name);
 sources.push('services/assistant/deploy/railway/Dockerfile','services/assistant/deploy/railway/Dockerfile.dockerignore','services/assistant/deploy/railway/start.mjs');
 const hashes={};for(const path of sources){const bytes=await readFile(join(repository,path));await writeFile(join(context,path),bytes);if(path.endsWith('.mjs'))hashes[path]=createHash('sha256').update(bytes).digest('hex');}
 docker(['build','--file',join(server,'deploy/railway/Dockerfile'),'--tag',image,context],{timeout:180000});built=true;
 report.image=JSON.parse(docker(['image','inspect',image,'--format','{{json .Id}}']).stdout.trim());
 const imageFiles=JSON.parse(docker(['run','--rm','--network','none','--entrypoint','node',image,...json("import {readFile,readdir} from 'node:fs/promises';import {createHash} from 'node:crypto';const files={};async function visit(root){for(const entry of await readdir(root,{withFileTypes:true})){const path=root+'/'+entry.name;if(entry.isDirectory())await visit(path);else files[path.slice(5)]=createHash('sha256').update(await readFile(path)).digest('hex');}}await visit('/app');console.log(JSON.stringify(files));").slice(1)]).stdout.trim());
 assert.deepEqual(imageFiles,hashes);report.applicationFiles=imageFiles;
 const master=randomBytes(32).toString('hex'),token='jt_'+randomBytes(32).toString('base64url'),secret=join(temporary,'provider.secret.json'),environment=join(temporary,'fixture.env');
 await sealProviderKey(secret,'explicit-fake-container-provider',master);
 await writeFile(environment,['RAILWAY_VOLUME_MOUNT_PATH=/data','ASSISTANT_MASTER_KEY='+master,'ASSISTANT_SEALED_PROVIDER_JSON='+await readFile(secret,'utf8'),'ASSISTANT_CREDENTIALS_JSON='+JSON.stringify([{id:'synthetic-learner',hash:tokenHash(token),expiresAt:'2099-01-01T00:00:00Z'}]),'ASSISTANT_MODEL=explicit-fixture','ASSISTANT_DAILY_LIMIT=1','ASSISTANT_GLOBAL_DAILY_LIMIT=1'].join('\n'),{mode:0o600});
 const productionVolume=id+'-production';createVolume(productionVolume);
 const production=launch(id+'-production',productionVolume,environment);await ready(production);
 const identity=inspect(production,"import {readFile,stat} from 'node:fs/promises';const q=await stat('/data/jective/quota.sqlite');const status=await readFile('/proc/1/status','utf8');console.log(JSON.stringify({uid:q.uid,gid:q.gid,mode:q.mode&511,identity:status.split('\\n').filter(line=>/^(Uid|Gid|Groups|CapEff):/.test(line))}));");
 assert.equal(identity.uid,1000);assert.equal(identity.gid,1000);assert.equal(identity.mode,0o600);
 assert.match(identity.identity.join('\n'),/Uid:\s+1000\s+1000\s+1000\s+1000/);assert.match(identity.identity.join('\n'),/CapEff:\s+0{16}/);assert.ok(identity.identity.find(line=>line.startsWith('Groups:')).trim()==='Groups:');
 const unauthorized=inspect(production,"const r=await fetch('http://127.0.0.1:8787/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});await r.text();console.log(JSON.stringify({status:r.status}));");assert.equal(unauthorized.status,401);
 report.checks.push({name:'Actual production CMD, health, authentication and private non-root storage',status:'PASS',identity});
 const fixture=join(temporary,'fixture.mjs');await writeFile(fixture,"import {startRailway} from '/app/services/assistant/deploy/railway/start.mjs';import {createAssistantServer} from '/app/services/assistant/server.mjs';await startRailway(process.env,options=>createAssistantServer({...options,log:()=>{},fetchImpl:async()=>Response.json({choices:[{message:{content:'EXPLICIT LOCAL PROVIDER FIXTURE'}}]})}));",{mode:0o644});
 const fixtureVolume=id+'-fixture';createVolume(fixtureVolume);const simulated=launch(id+'-fixture',fixtureVolume,environment,fixture);await ready(simulated);
 const request=()=>inspect(simulated,"const r=await fetch('http://127.0.0.1:8787/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+"+JSON.stringify(token)+",'Content-Type':'application/json'},body:JSON.stringify({question:'explicit local fixture',context:''})});console.log(JSON.stringify({status:r.status,body:await r.json()}));");
 const first=request();assert.equal(first.status,200);assert.equal(first.body.choices[0].message.content,'EXPLICIT LOCAL PROVIDER FIXTURE');
 docker(['restart','--time','50',simulated]);await ready(simulated);assert.equal(request().status,429);
 report.checks.push({name:'Explicit local provider fixture and durable quota across actual restart',status:'PASS'});report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error);process.exitCode=1;}
finally{
 const cleanup=[];
 // A stopped Docker daemon must not suppress the original verification failure
 // or prevent cleanup attempts for the other resources and the report itself.
 const removeDocker=(resource,args)=>{try{cleanup.push({resource,exitCode:docker(args,{allowFailure:true}).status});}catch{cleanup.push({resource,exitCode:null,error:'Docker cleanup could not finish'});}};
 for(const container of ownedContainers)removeDocker('container',['rm','--force',container]);
 for(const volume of ownedVolumes)removeDocker('volume',['volume','rm',volume]);
 if(built)removeDocker('image',['image','rm',image]);
 try{
  const path=resolve(temporary),guard=relative(resolve(tmpdir()),path);if(!guard||guard.startsWith('..')||isAbsolute(guard)||!guard.startsWith('jective-assistant-container-'))throw new Error('Unsafe fixture cleanup');
  await rm(path,{recursive:true,force:true});cleanup.push({resource:'temporary directory',exitCode:0});
 }catch{cleanup.push({resource:'temporary directory',exitCode:null,error:'Temporary directory cleanup could not finish'});}
 report.cleanup=cleanup;if(cleanup.some(item=>item.exitCode!==0)){report.status='FAIL';process.exitCode=1;}
 report.finishedAt=new Date().toISOString();await mkdir(join(repository,'.verification'),{recursive:true});await writeFile(join(repository,'.verification/assistant-container-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
