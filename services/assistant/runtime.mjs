import {isAbsolute,resolve} from 'node:path';
import {openProviderKey} from './secret-store.mjs';
import {readPrivateFile} from './private-file.mjs';
import {QuotaStore} from './quota-store.mjs';

export function serverConfig(env){
 const paths=['ASSISTANT_SECRET_FILE','ASSISTANT_CREDENTIALS_FILE','ASSISTANT_QUOTA_FILE'];
 const config={};
 for(const name of paths){if(typeof env[name]!=='string'||!isAbsolute(env[name]))throw new Error('Set absolute '+name);config[name]=resolve(env[name]);}
 if(new Set(paths.map(name=>process.platform==='win32'?config[name].toLowerCase():config[name])).size!==paths.length)throw new Error('Server storage files must be distinct');
 if(typeof env.ASSISTANT_MODEL!=='string'||!env.ASSISTANT_MODEL.trim()||env.ASSISTANT_MODEL.length>200||/[\r\n]/.test(env.ASSISTANT_MODEL))throw new Error('Set ASSISTANT_MODEL');
 const port=Number(env.PORT??8787);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
 const host=env.ASSISTANT_HOST??'127.0.0.1';if(!['127.0.0.1','0.0.0.0'].includes(host))throw new Error('Invalid listen host');
 const integer=(name,fallback,max)=>{const value=Number(env[name]??fallback);if(!Number.isSafeInteger(value)||value<1||value>max)throw new Error('Invalid '+name);return value;};
 return {...config,model:env.ASSISTANT_MODEL,port,host,dailyLimit:integer('ASSISTANT_DAILY_LIMIT',30,10000),globalDailyLimit:integer('ASSISTANT_GLOBAL_DAILY_LIMIT',1000,1000000),concurrency:integer('ASSISTANT_CONCURRENCY',4,64)};
}

export async function startAssistant(factory,env=process.env){
 const config=serverConfig(env);
 if(env.ASSISTANT_MASTER_KEY&&env.ASSISTANT_MASTER_KEY_FILE)throw new Error('Choose one master-key source');
 if(env.ASSISTANT_MASTER_KEY_FILE&&!isAbsolute(env.ASSISTANT_MASTER_KEY_FILE))throw new Error('Set absolute ASSISTANT_MASTER_KEY_FILE');
 const master=env.ASSISTANT_MASTER_KEY_FILE?(await readPrivateFile(env.ASSISTANT_MASTER_KEY_FILE,128)).toString('utf8').trim():env.ASSISTANT_MASTER_KEY;
 const providerKey=await openProviderKey(config.ASSISTANT_SECRET_FILE,master);
 delete env.ASSISTANT_MASTER_KEY;delete env.OPENAI_API_KEY;
 const credentials=JSON.parse((await readPrivateFile(config.ASSISTANT_CREDENTIALS_FILE,2*1024*1024)).toString('utf8'));
 const quota=new QuotaStore(config.ASSISTANT_QUOTA_FILE);let server;
 try{
  server=factory({providerKey,model:config.model,credentials,quota,dailyLimit:config.dailyLimit,globalDailyLimit:config.globalDailyLimit,concurrency:config.concurrency});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(config.port,config.host,()=>{server.off('error',reject);resolve();});});
 }catch(error){quota.close();throw error;}
 const shutdown=()=>{
  const deadline=setTimeout(()=>server.closeAllConnections(),45000);deadline.unref();
  server.close(()=>clearTimeout(deadline));
 };
 server.once('close',()=>{quota.close();process.off('SIGTERM',shutdown);process.off('SIGINT',shutdown);});
 process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
 process.stdout.write(config.host==='127.0.0.1'?'JECTIVE assistant listening on loopback\n':'JECTIVE assistant listening behind managed HTTPS ingress\n');
 return server;
}
