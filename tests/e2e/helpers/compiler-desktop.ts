import {chromium,_electron as electron,type Page,type Browser} from '@playwright/test';
import {spawn,type ChildProcess} from 'node:child_process';
import {readFile,unlink} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {parkVerificationWindow} from './window';

function ownedProfile(root:string){const rel=relative(resolve(tmpdir()),resolve(root));if(!rel||rel.startsWith('..')||isAbsolute(rel)||!basename(root).startsWith('jective-real-compiler-'))throw new Error('UNSAFE_COMPILER_PROFILE');}
async function stop(child:ChildProcess){
 if(child.exitCode!==null||child.signalCode!==null)return;
 if(process.platform==='win32'&&child.pid){const killer=spawn('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore',shell:false});await new Promise<void>(done=>{killer.once('error',()=>{child.kill();done();});killer.once('exit',()=>done());});}else child.kill();
 if(child.exitCode===null&&child.signalCode===null)await new Promise<void>((done,reject)=>{const timer=setTimeout(()=>reject(new Error('COMPILER_FIXTURE_STOP_TIMEOUT')),10000);child.once('exit',()=>{clearTimeout(timer);done();});});
}

/** Fused packages use only a temporary loopback Chromium endpoint. Never enable
 * a main inspector or alter production fuses. All profile writes are isolated. */
export async function launchCompilerDesktop(root:string,toolchain:string,executable?:string):Promise<{page:Page;stop():Promise<void>}>{
 ownedProfile(root);
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));
 for(const key of ['ELECTRON_RUN_AS_NODE','OPENAI_API_KEY','ASSISTANT_MASTER_KEY','JECTIVE_ASSISTANT_SERVER','JECTIVE_ASSISTANT_TOKEN'])delete env[key];
 env.JECTIVE_WORKSPACE_ROOT=root;env.JECTIVE_TOOLCHAIN_ROOT=toolchain;
 if(!executable){
  const app=await electron.launch({args:['.'],env});
  try{app.context().on('dialog',dialog=>void dialog.accept().catch(()=>{}));const page=await app.firstWindow();await parkVerificationWindow(app);return {page,stop:async()=>{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});await stop(app.process());}};}
  catch(error){await stop(app.process());throw error;}
 }
 const application=resolve(executable);if(basename(application)!=='JECTIVE Robotics Studio.exe')throw new Error('Choose the application executable, never Setup');
 await unlink(join(root,'DevToolsActivePort')).catch(error=>{if(error.code!=='ENOENT')throw error;});
 const child=spawn(application,['--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--disable-background-timer-throttling'],{env,windowsHide:true,stdio:['ignore','ignore','pipe'],shell:false});
 let diagnostic='',failure:Error|undefined,browser:Browser|undefined;
 child.stderr?.on('data',bytes=>{diagnostic=(diagnostic+String(bytes)).slice(-16000);});child.once('error',error=>{failure=error;});
 try{
  const deadline=Date.now()+30000;
  while(Date.now()<deadline){
   if(failure||child.exitCode!==null)throw new Error('PACKAGED_COMPILER_START_FAILED: '+(failure?.message??diagnostic));
   try{const port=Number((await readFile(join(root,'DevToolsActivePort'),'utf8')).split('\n')[0]);if(Number.isInteger(port)&&port>0&&port<=65535){browser=await chromium.connectOverCDP('http://127.0.0.1:'+port,{timeout:1000});break;}}catch{/* Wait for this owned process to open its endpoint. */}
   await new Promise(done=>setTimeout(done,100));
  }
  if(!browser)throw new Error('PACKAGED_COMPILER_DIAGNOSTICS_UNAVAILABLE');
  for(const context of browser.contexts())context.on('dialog',dialog=>void dialog.accept().catch(()=>{}));
  for(let attempt=0;attempt<100;attempt++){
   const page=browser.contexts().flatMap(context=>context.pages()).find(page=>page.url().startsWith('jective://studio/'));
   if(page)return {page,stop:async()=>{await browser!.close().catch(()=>{});await stop(child);}};
   await new Promise(done=>setTimeout(done,100));
  }
  throw new Error('PACKAGED_COMPILER_PAGE_UNAVAILABLE');
 }catch(error){await browser?.close().catch(()=>{});await stop(child);throw error;}
}
