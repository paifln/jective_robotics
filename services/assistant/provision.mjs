import {randomBytes} from 'node:crypto';
import {sealProviderKey} from './secret-store.mjs';
import {tokenHash} from './server.mjs';
import {readPrivateFile} from './private-file.mjs';

// Secrets are supplied through an administrator's environment, never CLI arguments.
if(process.argv[2]==='seal'){
  if(process.env.ASSISTANT_MASTER_KEY&&process.env.ASSISTANT_MASTER_KEY_FILE)throw new Error('Choose one master-key source');
  const master=process.env.ASSISTANT_MASTER_KEY_FILE?(await readPrivateFile(process.env.ASSISTANT_MASTER_KEY_FILE,128)).toString('utf8').trim():process.env.ASSISTANT_MASTER_KEY;
  await sealProviderKey(process.env.ASSISTANT_SECRET_FILE,process.env.OPENAI_API_KEY,master);
  delete process.env.OPENAI_API_KEY;delete process.env.ASSISTANT_MASTER_KEY;
  process.stdout.write('Encrypted provider file created\n');
}else if(process.argv[2]==='credential'){
  const token=randomBytes(32).toString('base64url');
  const id=process.env.ASSISTANT_LEARNER_ID;if(!/^\w[\w-]{0,79}$/.test(id??''))throw new Error('Set ASSISTANT_LEARNER_ID');
  const expiresAt=new Date(Date.now()+30*86400000).toISOString();
  process.stdout.write(JSON.stringify({token,registryEntry:{id,hash:tokenHash(token),expiresAt}},null,2)+'\n');
}else throw new Error('Use seal or credential');
