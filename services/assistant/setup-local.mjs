import {randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {sealProviderKey} from './secret-store.mjs';
import {generateLearnerCredential} from './credentials.mjs';
import {startAssistant} from './runtime.mjs';
import {createAssistantServer} from './server.mjs';
import {readPrivateFile} from './private-file.mjs';

export async function prepareLocal({data,master,model,providerKey,port=8787}){
 const repository=resolve(fileURLToPath(new URL('../..',import.meta.url)));
 for(const directory of [data,master]){if(typeof directory!=='string'||!isAbsolute(directory))throw new Error('Absolute private directories required');const rel=relative(repository,resolve(directory));if(!rel.startsWith('..')&&!isAbsolute(rel))throw new Error('Secrets must stay outside the repository');}
 if(resolve(data).toLowerCase()===resolve(master).toLowerCase())throw new Error('Use separate secret and master directories');
 if(typeof model!=='string'||!model.trim()||model.length>200||/[\r\n]/.test(model))throw new Error('Choose an available model');
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
 const key=randomBytes(32).toString('hex'),issued=generateLearnerCredential('local-check');
 await writeFile(join(master,'master.key'),key,{mode:0o600,flag:'wx'});
 await sealProviderKey(join(data,'provider.secret.json'),providerKey,key);
 await writeFile(join(data,'credentials.json'),JSON.stringify([issued.registryEntry]),{mode:0o600,flag:'wx'});
 const config={ASSISTANT_SECRET_FILE:join(data,'provider.secret.json'),ASSISTANT_CREDENTIALS_FILE:join(data,'credentials.json'),ASSISTANT_QUOTA_FILE:join(data,'quota.sqlite'),ASSISTANT_MASTER_KEY_FILE:join(master,'master.key'),ASSISTANT_MODEL:model,PORT:String(port),ASSISTANT_DAILY_LIMIT:'10',ASSISTANT_GLOBAL_DAILY_LIMIT:'10',ASSISTANT_CONCURRENCY:'1'};
 await writeFile(join(data,'runtime.json'),JSON.stringify(config,null,2),{mode:0o600,flag:'wx'});
 return {token:issued.token,endpoint:'http://127.0.0.1:'+port};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  if(process.argv[2]==='prepare'){
   const result=await prepareLocal({data:process.env.JECTIVE_SETUP_DATA,master:process.env.JECTIVE_SETUP_MASTER,model:process.env.JECTIVE_SETUP_MODEL,providerKey:process.env.OPENAI_API_KEY,port:Number(process.env.JECTIVE_SETUP_PORT??8787)});
   delete process.env.OPENAI_API_KEY;process.stdout.write(JSON.stringify(result));
  }else if(process.argv[2]==='start'){
   const config=JSON.parse((await readPrivateFile(process.argv[3],32768)).toString('utf8'));await startAssistant(createAssistantServer,config);
  }else throw new Error('Invalid setup command');
 }catch{delete process.env.OPENAI_API_KEY;process.stderr.write('Local setup failed. Check private directories and configuration; existing secrets were not overwritten.\n');process.exitCode=1;}
}
