import {mkdir,lstat,chown,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {credentialRegistry} from '../../policy.mjs';
import {openProviderKey} from '../../secret-store.mjs';
import {startAssistant} from '../../runtime.mjs';
import {createAssistantServer} from '../../server.mjs';

/** Materialise only encrypted provider data and a hash-only learner registry. */
export async function startRailway(env=process.env,factory=createAssistantServer){
 if(env.RAILWAY_VOLUME_MOUNT_PATH!=='/data')throw new Error('Attach a persistent Railway volume at /data');
 const volume=await lstat('/data');if(!volume.isDirectory()||volume.isSymbolicLink())throw new Error('Invalid volume');
 const data='/data/jective';await mkdir(data,{mode:0o700,recursive:true});
 const entry=await lstat(data);if(!entry.isDirectory()||entry.isSymbolicLink())throw new Error('Invalid storage directory');
 // Railway mounts volumes as root. Drop privileges before parsing secrets or serving requests.
 if(process.platform==='linux'&&process.getuid()===0){await chown(data,1000,1000);process.setgroups([]);process.setgid(1000);process.setuid(1000);}
 return startHosted(env,data,factory);
}

export async function startHosted(env,data,factory=createAssistantServer){
 let temporary,server;
 try{
  const sealed=env.ASSISTANT_SEALED_PROVIDER_JSON,registry=env.ASSISTANT_CREDENTIALS_JSON;
  if(typeof sealed!=='string'||Buffer.byteLength(sealed)>12000||typeof registry!=='string'||Buffer.byteLength(registry)>2*1024*1024)throw new Error('Missing or oversized server credentials');
  const credentials=JSON.parse(registry);credentialRegistry(credentials);
  temporary=await mkdtemp(join(tmpdir(),'jective-hosted-'));
  const secret=join(temporary,'provider.secret.json'),learners=join(temporary,'credentials.json');
  await writeFile(secret,sealed,{mode:0o600,flag:'wx'});await writeFile(learners,JSON.stringify(credentials),{mode:0o600,flag:'wx'});
  // Verify ciphertext and master before accepting traffic; plaintext never written to disk.
  await openProviderKey(secret,env.ASSISTANT_MASTER_KEY);
  const config={...env,ASSISTANT_HOST:'0.0.0.0',ASSISTANT_SECRET_FILE:secret,ASSISTANT_CREDENTIALS_FILE:learners,ASSISTANT_QUOTA_FILE:join(data,'quota.sqlite')};
  delete config.ASSISTANT_SEALED_PROVIDER_JSON;delete config.ASSISTANT_CREDENTIALS_JSON;
  server=await startAssistant(factory,config);
  server.once('close',()=>{void rm(temporary,{recursive:true,force:true});});
  return server;
 }finally{
  for(const key of ['OPENAI_API_KEY','ASSISTANT_MASTER_KEY','ASSISTANT_SEALED_PROVIDER_JSON','ASSISTANT_CREDENTIALS_JSON'])delete env[key];
  if(temporary&&!server)await rm(temporary,{recursive:true,force:true});
 }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{await startRailway();}catch{process.stderr.write('Assistant startup failed; check private configuration and persistent volume.\n');process.exitCode=1;}
}
