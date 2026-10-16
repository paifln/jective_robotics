import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Deliberately sends no credential and never invokes the paid provider.
// This checks the public boundary, not model availability or quota persistence.
const target=new URL(process.argv[2]??'');
if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash||target.pathname!=='/')throw new Error('Provide an explicit HTTPS service origin without credentials, path, query or fragment.');
const scenarios=[
 {name:'health',path:'/healthz',status:200},
 {name:'missing credential',path:'/chat/completions',method:'POST',body:'{}',status:401},
 {name:'invalid credential',path:'/chat/completions',method:'POST',body:'{}',headers:{authorization:'Bearer invalid'},status:401},
 {name:'cross-origin chat',path:'/chat/completions',method:'POST',body:'{}',headers:{origin:'https://example.invalid'},status:404},
 {name:'cross-origin health',path:'/healthz',headers:{origin:'https://example.invalid'},status:404},
 {name:'unsupported method',path:'/chat/completions',status:404},
 {name:'unknown route',path:'/not-a-route',status:404},
];
async function readDiagnostic(response){
 const reader=response.body?.getReader();if(!reader)throw new Error('Missing diagnostic body');
 const chunks=[];let size=0;
 try{
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;assert.ok(size<=4096,'Unexpectedly large diagnostic response');chunks.push(value);}
  return Buffer.concat(chunks,size).toString('utf8');
 }finally{try{await reader.cancel();}finally{reader.releaseLock();}}
}
const report={startedAt:new Date().toISOString(),origin:target.origin,scope:'Public HTTPS boundary only. No real token, provider call, model, balance, cloud process identity or durable quota verification.',status:'RUNNING',checks:[]};
try{
 for(const scenario of scenarios){
  const response=await fetch(new URL(scenario.path,target),{method:scenario.method??'GET',headers:{'content-type':'application/json',...scenario.headers},body:scenario.body,redirect:'error',signal:AbortSignal.timeout(10000)});
  const text=await readDiagnostic(response);
  const body=JSON.parse(text);
  const check={name:scenario.name,status:response.status,cacheControl:response.headers.get('cache-control'),contentType:response.headers.get('content-type'),nosniff:response.headers.get('x-content-type-options'),crossOriginAccess:response.headers.get('access-control-allow-origin')};
  report.checks.push(check);
  assert.equal(response.status,scenario.status,scenario.name);assert.equal(check.cacheControl,'no-store');assert.equal(check.nosniff,'nosniff');assert.match(check.contentType??'',/^application\/json/);assert.equal(check.crossOriginAccess,null);
  if(scenario.status===200)assert.deepEqual(body,{status:'ready'});
  else{assert.equal(body.error?.code,'ASSISTANT_REQUEST_FAILED');assert.match(body.error?.requestId??'',/^[a-f0-9-]{36}$/);assert.deepEqual(Object.keys(body),['error']);assert.deepEqual(Object.keys(body.error).sort(),['code','requestId']);}
 }
 report.status='PASS';
}catch(error){report.status='FAIL';report.error=error instanceof Error?error.message:'Remote check failed';process.exitCode=1;}
finally{
 report.finishedAt=new Date().toISOString();
 const directory=new URL('../.verification/',import.meta.url);await mkdir(directory,{recursive:true});
 await writeFile(new URL('assistant-remote-verification.json',directory),JSON.stringify(report,null,2));
 console.log(JSON.stringify({...report,reportFile:fileURLToPath(new URL('assistant-remote-verification.json',directory))}));
}
