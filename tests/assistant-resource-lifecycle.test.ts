import {it,expect,vi} from 'vitest';
import {createServer} from 'node:http';
import {mkdtemp,writeFile,readFile,readdir,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
vi.mock('electron',()=>({safeStorage:{isEncryptionAvailable:()=>true,encryptString:(text:string)=>Buffer.from('TEST ONLY '+text),decryptString:(bytes:Buffer)=>bytes.toString().replace('TEST ONLY ','')}}));
import {AssistantService} from '../packages/assistant';

async function cleanup(root:string){if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-assistant-resources-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true});}
it('real loopback error, declared-excess and streamed-excess responses close their unfinished bodies and release the next request',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-assistant-resources-')),service=new AssistantService(join(root,'assistant.json'));
 let mode='http';const closed:string[]=[],responses:Response[]=[];
 const server=createServer((request,response)=>{const current=mode;request.resume();response.on('close',()=>closed.push(current));
  if(current==='http'){response.writeHead(503);response.write('LOCAL ERROR FIXTURE');return;}
  if(current==='header'){response.writeHead(200,{'Content-Length':'256001'});response.write('x');return;}
  if(current==='stream'){response.writeHead(200);response.write(Buffer.alloc(256001));return;}
  response.end(JSON.stringify({choices:[{message:{content:'LOCAL SUCCESS FIXTURE'},finish_reason:'stop'}]}));
 });
 await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address();if(!address||typeof address==='string')throw new Error('NO_FIXTURE_PORT');
 const nativeFetch=globalThis.fetch.bind(globalThis),transport=vi.spyOn(globalThis,'fetch').mockImplementation(async(...args)=>{const response=await nativeFetch(...args);responses.push(response);return response;});
 try{
  await service.configure({enabled:true,endpoint:'http://127.0.0.1:'+address.port,model:'local-fixture',apiKey:'EXPLICIT_TEST_CREDENTIAL'});
  for(const current of ['http','header','stream']){
   mode=current;await expect(service.ask({question:'local request',context:''})).rejects.toThrow(current==='http'?'AI_PROVIDER_HTTP_503':'AI_RESPONSE_TOO_LARGE');await expect.poll(()=>closed.includes(current)).toBe(true);expect(responses.at(-1)!.body!.locked).toBe(false);expect(service.cancel()).toBe(false);
  }
  mode='good';expect(await service.ask({question:'next local request',context:''})).toBe('LOCAL SUCCESS FIXTURE');expect(responses.at(-1)!.body!.locked).toBe(false);expect(transport).toHaveBeenCalledTimes(4);
 }finally{service.cancel();transport.mockRestore();server.closeAllConnections();await new Promise<void>(done=>server.close(()=>done()));await cleanup(root);}
},15000);

it('configuration reads are bounded, invalid text is retained for repair and predictable legacy temp files are untouched',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-assistant-resources-')),path=join(root,'assistant.json'),service=new AssistantService(path);
 try{
  await writeFile(path+'.tmp','DO NOT OVERWRITE THIS EXISTING FILE');
  await service.configure({enabled:true,endpoint:'https://assistant.example',model:'fixture',apiKey:'TEST_ONLY_SECRET'});expect(await readFile(path+'.tmp','utf8')).toBe('DO NOT OVERWRITE THIS EXISTING FILE');expect(await readdir(root)).toEqual(['assistant.json','assistant.json.tmp']);
  const oversized=Buffer.alloc(32*1024+1,65);await writeFile(path,oversized);await expect(service.settings()).rejects.toThrow('AI_CONFIG_INVALID');expect(await readFile(path)).toEqual(oversized);
  const invalidUtf8=Buffer.from([123,34,120,34,58,34,255,34,125]);await writeFile(path,invalidUtf8);await expect(service.settings()).rejects.toThrow('AI_CONFIG_INVALID');expect(await readFile(path)).toEqual(invalidUtf8);
  const missingParent=join(root,'later','assistant.json'),later=new AssistantService(missingParent);await expect(later.configure({enabled:false,endpoint:'https://assistant.example',model:'fixture'})).rejects.toThrow();await mkdir(join(root,'later'));await later.configure({enabled:false,endpoint:'https://assistant.example',model:'fixture'});expect(await later.settings()).toMatchObject({enabled:false,model:'fixture'});
 }finally{await cleanup(root);}
});
