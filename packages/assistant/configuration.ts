import {z} from 'zod';
import {readBoundedFile} from '../persistence/bounded-file';
import {replaceFileAtomically} from '../persistence/atomic-file';
import {parseJsonDocument} from '../contracts/json-document';

const Config=z.object({enabled:z.boolean(),endpoint:z.string().max(500),model:z.string().min(1).max(100),encryptedKey:z.string().max(12000)}).strict();
export type AssistantConfiguration=z.infer<typeof Config>;
export async function readAssistantConfiguration(path:string):Promise<AssistantConfiguration>{
 try{
  const bytes=await readBoundedFile(path,{maxBytes:32*1024,tooLarge:'AI_CONFIG_INVALID',invalid:'AI_CONFIG_INVALID',changed:'AI_CONFIG_INVALID'});
  return Config.parse(parseJsonDocument(bytes,'AI_CONFIG_INVALID'));
 }catch(error){
  if((error as NodeJS.ErrnoException).code==='ENOENT')return {enabled:false,endpoint:'https://api.openai.com/v1',model:'',encryptedKey:''};
  throw new Error('AI_CONFIG_INVALID');
 }
}
export async function writeAssistantConfiguration(path:string,value:AssistantConfiguration){
 await replaceFileAtomically(path,JSON.stringify(Config.parse(value)));
}
