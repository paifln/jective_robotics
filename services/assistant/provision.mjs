import {generateLearnerCredential} from './credentials.mjs';
import {sealProviderKey} from './secret-store.mjs';
import {readPrivateFile} from './private-file.mjs';

// Secrets are supplied through an administrator's environment, never CLI arguments.
if(process.argv[2]==='seal'){
  if(process.env.ASSISTANT_MASTER_KEY&&process.env.ASSISTANT_MASTER_KEY_FILE)throw new Error('Choose one master-key source');
  const master=process.env.ASSISTANT_MASTER_KEY_FILE?(await readPrivateFile(process.env.ASSISTANT_MASTER_KEY_FILE,128)).toString('utf8').trim():process.env.ASSISTANT_MASTER_KEY;
  await sealProviderKey(process.env.ASSISTANT_SECRET_FILE,process.env.OPENAI_API_KEY,master);
  delete process.env.OPENAI_API_KEY;delete process.env.ASSISTANT_MASTER_KEY;
  process.stdout.write('Encrypted provider file created\n');
}else if(process.argv[2]==='credential'){
  process.stdout.write(JSON.stringify(generateLearnerCredential(process.env.ASSISTANT_LEARNER_ID),null,2)+'\n');
}else throw new Error('Use seal or credential');
