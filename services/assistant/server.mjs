import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {tokenHash,credentialRegistry,chatInput} from './policy.mjs';
import {readJsonBody,RequestBodyError} from './request-body.mjs';
import {askProvider} from './provider.mjs';

export {tokenHash} from './policy.mjs';

/** A single-process gateway. HTTPS and durable deployment quotas belong to infrastructure. */
export function createAssistantServer({providerKey,model,credentials,quota,fetchImpl=fetch,dailyLimit=30,globalDailyLimit=1000,concurrency=4,requestDeadlineMs=40000,clock=()=>Date.now(),log=entry=>process.stdout.write(JSON.stringify(entry)+'\n')}){
  if(typeof providerKey!=='string'||!providerKey.trim()||Buffer.byteLength(providerKey)>4000||/[\r\n]/.test(providerKey)||typeof model!=='string'||!model.trim()||model.length>200||/[\r\n]/.test(model))throw new Error('Missing provider configuration');
  for(const n of [dailyLimit,globalDailyLimit,concurrency,requestDeadlineMs])if(!Number.isSafeInteger(n)||n<1)throw new Error('Invalid limits');
  if(requestDeadlineMs>40000)throw new Error('Invalid deadline');
  const permitted=credentialRegistry(credentials),counts=new Map();let active=0,globalCount=0,day='';
  const server=createServer(async(req,res)=>{
    const requestId=randomUUID();res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    const reply=(status,value)=>{if(res.destroyed)return;if(!req.complete)res.setHeader('Connection','close');res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
    const failure=(status)=>reply(status,{error:{code:'ASSISTANT_REQUEST_FAILED',requestId}});
    if(req.method==='GET'&&req.url==='/healthz'&&!req.headers.origin){reply(200,{status:'ready'});return;}
    // Cross-origin browser callers and arbitrary upstream targets are never supported.
    if(req.method!=='POST'||req.url!=='/chat/completions'||req.headers.origin){failure(404);req.resume();return;}
    const auth=req.headers.authorization??'';const match=/^Bearer ([A-Za-z0-9_-]{32,200})$/.exec(auth);
    const credential=match?permitted.get(tokenHash(match[1])):null;
    if(!credential||Date.parse(credential.expiresAt)<=clock()){failure(401);req.resume();return;}
    if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']??'')){failure(415);req.resume();return;}
    const today=new Date(clock()).toISOString().slice(0,10);if(today!==day){day=today;counts.clear();globalCount=0;}
    const used=counts.get(credential.id)??0;
    if(used>=dailyLimit||globalCount>=globalDailyLimit||active>=concurrency){res.setHeader('Retry-After','60');failure(429);req.resume();return;}
    try{if(quota&&!quota.reserve(credential.id,dailyLimit,globalDailyLimit,clock())){failure(429);req.resume();return;}}
    catch{failure(503);req.resume();return;}
    active++;counts.set(credential.id,used+1);globalCount++;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),requestDeadlineMs);
    res.on('close',()=>{if(!res.writableEnded)controller.abort();});
    let status=400;
    try{
      const input=chatInput(await readJsonBody(req,controller.signal));
      status=502;
      const response=await askProvider({providerKey,model,input,signal:controller.signal,fetchImpl});
      status=response.status;if(status===200)reply(status,response.value);else failure(status);
    }catch(error){status=controller.signal.aborted?504:error instanceof RequestBodyError?error.status:status;failure(status);}
    finally{
      clearTimeout(timer);active--;
      // Do not retain an incomplete/oversized upload after releasing its slot.
      if(!req.complete){res.once('finish',()=>req.destroy());if(res.writableFinished||res.destroyed)req.destroy();}
      try{log({event:'assistant_request',requestId,credentialId:credential.id,status});}catch{/* Logging failure must not crash the gateway or leak provider errors. */}
    }
  });
  server.requestTimeout=45000;server.headersTimeout=10000;server.keepAliveTimeout=5000;server.maxHeadersCount=32;
  server.maxConnections=64;
  return server;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const {startAssistant}=await import('./runtime.mjs');
  await startAssistant(createAssistantServer);
}
