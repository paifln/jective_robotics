import {gatewayHttpError} from './gateway-error';
import {chatCompletionRequest,chatCompletionAnswer,ChatHistorySchema} from './chat-completion';
import {safeStorage} from 'electron';
import {readFile,writeFile,rename} from 'node:fs/promises';
import {z} from 'zod';
import type {AssistantSettings} from '../contracts';
const Config=z.object({enabled:z.boolean(),endpoint:z.string().max(500),model:z.string().min(1).max(100),encryptedKey:z.string().max(12000)}).strict();
export function validateEndpoint(value:string){const url=new URL(value);if(url.username||url.password||url.hash||url.search)throw new Error('AI_ENDPOINT_INVALID');if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname)))throw new Error('AI_ENDPOINT_REQUIRES_HTTPS_OR_LOCALHOST');return url.toString().replace(/\/$/,'');}
export class AssistantService {
 private controller:AbortController|null=null;
 private configurationQueue:Promise<void>=Promise.resolve();
 constructor(readonly path:string,private readonly managedOnly=false){}
 private async config(){try{return Config.parse(JSON.parse(await readFile(this.path,'utf8')));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {enabled:false,endpoint:'https://api.openai.com/v1',model:'',encryptedKey:''};throw new Error('AI_CONFIG_INVALID');}}
 async settings():Promise<AssistantSettings>{const c=await this.config();if(this.managedOnly&&c.model!=='jective-managed')return {enabled:false,endpoint:'',model:'',keyConfigured:false};return {enabled:c.enabled,endpoint:c.endpoint,model:c.model,keyConfigured:!!c.encryptedKey};}
 async configure(value:unknown){
  // Validate and copy before queueing; caller mutation cannot change a pending write.
  const p=z.object({enabled:z.boolean(),endpoint:z.string(),model:z.string().min(1).max(100),apiKey:z.string().max(4000).optional()}).strict().parse(value);
  const pending=this.configurationQueue.then(async()=>{const old=await this.config();const endpoint=validateEndpoint(p.endpoint);if(p.apiKey&&!safeStorage.isEncryptionAvailable())throw new Error('AI_SECURE_STORAGE_UNAVAILABLE');const encryptedKey=p.apiKey===undefined?(endpoint===old.endpoint?old.encryptedKey:''):p.apiKey?safeStorage.encryptString(p.apiKey).toString('base64'):'';const target=this.path+'.tmp';await writeFile(target,JSON.stringify({enabled:p.enabled,endpoint,model:p.model,encryptedKey}),{mode:0o600});await rename(target,this.path);return true;});
  // A failed write is returned to its caller without poisoning later updates.
  this.configurationQueue=pending.then(()=>{},()=>{});return pending;
 }
 cancel(){if(!this.controller)return false;this.controller.abort();return true;}
 async ask(value:unknown){
  const p=z.object({question:z.string().min(1).max(8000),context:z.string().max(40000),history:ChatHistorySchema.optional()}).strict().parse(value);
  if(this.controller)throw new Error('AI_BUSY');
  // Reserve before the first await: cancellation covers configuration loading too.
  const controller=new AbortController();this.controller=controller;
  const timeout=setTimeout(()=>controller.abort(),45000);
  try{
   const c=await this.config();controller.signal.throwIfAborted();
   if(!c.enabled||(this.managedOnly&&c.model!=='jective-managed'))throw new Error('AI_DISABLED');
   const endpoint=validateEndpoint(c.endpoint);
   if(c.encryptedKey&&!safeStorage.isEncryptionAvailable())throw new Error('AI_SECURE_STORAGE_UNAVAILABLE');
   const key=c.encryptedKey?safeStorage.decryptString(Buffer.from(c.encryptedKey,'base64')):'';
   const response=await fetch(endpoint+'/chat/completions',{method:'POST',redirect:'error',signal:controller.signal,headers:{'Content-Type':'application/json',...(key?{Authorization:'Bearer '+key}:{})},body:JSON.stringify(c.model==='jective-managed'?p:chatCompletionRequest(endpoint,c.model,p.question,p.context,p.history))});
   controller.signal.throwIfAborted();
   if(!response.ok)throw new Error(c.model==='jective-managed'?gatewayHttpError(response.status):'AI_PROVIDER_HTTP_'+response.status);
   const length=Number(response.headers.get('content-length')??0);if(length>256000)throw new Error('AI_RESPONSE_TOO_LARGE');
   const reader=response.body?.getReader();if(!reader)throw new Error('AI_EMPTY_RESPONSE');
   const chunks:Uint8Array[]=[];let size=0;
   for(;;){const next=await reader.read();controller.signal.throwIfAborted();if(next.done)break;size+=next.value.length;if(size>256000){await reader.cancel();throw new Error('AI_RESPONSE_TOO_LARGE');}chunks.push(next.value);}
   return chatCompletionAnswer(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  }catch(e){
   if(controller.signal.aborted)throw new Error('AI_INTERRUPTED_OR_TIMEOUT');
   if(e instanceof Error&&/^AI_/.test(e.message))throw e;
   throw new Error('AI_REQUEST_FAILED: check provider URL, model and connection; secrets are omitted from diagnostics');
  }finally{clearTimeout(timeout);if(this.controller===controller)this.controller=null;}
 }
}
