import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {readPrivateFile} from './private-file.mjs';

function masterKey(value){
  if(!/^[a-f0-9]{64}$/i.test(value??''))throw new Error('ASSISTANT_MASTER_KEY must be 32 bytes in hex');
  return Buffer.from(value,'hex');
}
export async function sealProviderKey(path,secret,master){
  if(typeof secret!=='string'||!secret.trim()||Buffer.byteLength(secret,'utf8')>4000)throw new Error('Invalid provider key');
  const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',masterKey(master),nonce);
  cipher.setAAD(Buffer.from('jective-assistant-provider-v1'));
  const encrypted=Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]);
  // Never overwrite an existing credential accidentally.
  await writeFile(path,JSON.stringify({version:1,nonce:nonce.toString('hex'),tag:cipher.getAuthTag().toString('hex'),encrypted:encrypted.toString('hex')}),{mode:0o600,flag:'wx'});
}
export async function openProviderKey(path,master){
  const bytes=await readPrivateFile(path,12000);
  const data=JSON.parse(bytes.toString('utf8'));
  if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(key=>!['version','nonce','tag','encrypted'].includes(key))||data.version!==1||typeof data.nonce!=='string'||typeof data.tag!=='string'||typeof data.encrypted!=='string'||!/^[a-f0-9]{24}$/.test(data.nonce)||!/^[a-f0-9]{32}$/.test(data.tag)||!/^[a-f0-9]{2,8000}$/.test(data.encrypted)||data.encrypted.length%2)throw new Error('Invalid secret file');
  const decipher=createDecipheriv('aes-256-gcm',masterKey(master),Buffer.from(data.nonce,'hex'));
  decipher.setAAD(Buffer.from('jective-assistant-provider-v1'));decipher.setAuthTag(Buffer.from(data.tag,'hex'));
  return Buffer.concat([decipher.update(Buffer.from(data.encrypted,'hex')),decipher.final()]).toString('utf8');
}
