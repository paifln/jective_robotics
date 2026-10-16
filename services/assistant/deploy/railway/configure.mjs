import {spawn} from 'node:child_process';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readPrivateFile} from '../../private-file.mjs';
import {openProviderKey} from '../../secret-store.mjs';
import {credentialRegistry} from '../../policy.mjs';

export async function runPrivate(binary,args,input){
 const env={...process.env};for(const key of ['OPENAI_API_KEY','ASSISTANT_MASTER_KEY','ASSISTANT_SEALED_PROVIDER_JSON','ASSISTANT_CREDENTIALS_JSON','JECTIVE_ASSISTANT_TOKEN'])delete env[key];
 await new Promise((done,reject)=>{
  const child=spawn(binary,args,{env,windowsHide:true,stdio:['pipe','ignore','ignore']});
  let settled=false;const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);if(error){if(child.pid&&child.exitCode===null&&child.signalCode===null)child.kill();reject(error);}else done();};
  const timer=setTimeout(()=>{child.kill();finish(new Error('Railway variable request timed out'));},60000);
  child.once('error',()=>finish(new Error('Railway CLI could not start')));
  child.once('exit',code=>finish(code===0?null:new Error('Railway variable request failed')));
  child.stdin.on('error',()=>finish(new Error('Railway input failed')));child.stdin.end(input);
 });
}

/** Explicit project/service only. No listing of secret-bearing Railway variables. */
export async function configureRailway({directory,project,service,binary},run=runPrivate){
 if(typeof project!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(project)||typeof service!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(service)||typeof binary!=='string'||!binary)throw new Error('Choose an explicit Railway project and service');
 const root=resolve(directory),config=JSON.parse((await readPrivateFile(join(root,'runtime.json'),32768)).toString('utf8'));
 const sealed=(await readPrivateFile(config.ASSISTANT_SECRET_FILE,12000)).toString('utf8');
 const master=(await readPrivateFile(config.ASSISTANT_MASTER_KEY_FILE,128)).toString('utf8').trim();
 const credentials=(await readPrivateFile(config.ASSISTANT_CREDENTIALS_FILE,2*1024*1024)).toString('utf8');credentialRegistry(JSON.parse(credentials));
 await openProviderKey(config.ASSISTANT_SECRET_FILE,master);
 if(typeof config.ASSISTANT_MODEL!=='string'||!config.ASSISTANT_MODEL.trim()||config.ASSISTANT_MODEL.length>200||/[\r\n]/.test(config.ASSISTANT_MODEL))throw new Error('Choose an available model');
 const values={ASSISTANT_SEALED_PROVIDER_JSON:sealed,ASSISTANT_MASTER_KEY:master,ASSISTANT_CREDENTIALS_JSON:credentials,ASSISTANT_MODEL:config.ASSISTANT_MODEL,ASSISTANT_DAILY_LIMIT:'10',ASSISTANT_GLOBAL_DAILY_LIMIT:'10',ASSISTANT_CONCURRENCY:'1',RAILWAY_DEPLOYMENT_DRAINING_SECONDS:'50'};
 let configured=0;
 for(const [name,value]of Object.entries(values)){
  // Values never enter command-line arguments; even CLI stderr is not forwarded.
  await run(binary,['variable','set',name,'--stdin','--skip-deploys','--project',project,'--service',service,'--environment','production'],value);configured++;
 }
 return {configured,project,service,environment:'production',deployed:false};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const result=await configureRailway({directory:process.argv[2],project:process.argv[3],service:process.argv[4],binary:process.argv[5]});process.stdout.write(JSON.stringify(result)+'\n');}
 catch{process.stderr.write('Railway configuration failed. Some variables may already be set; no deployment was requested. Check the selected project, service and login privately.\n');process.exitCode=1;}
}
