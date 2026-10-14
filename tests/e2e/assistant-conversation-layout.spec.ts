import {test,expect,_electron as electron} from '@playwright/test';
import {createServer} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';

test('long replies scroll inside the dialogue, preserve reading position and keep the composer reachable',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-chat-layout-'));
 let requests=0,releaseReply:(()=>void)|undefined;
 const longAnswer=Array.from({length:120},(_,i)=>`LOCAL FIXTURE explanation line ${i+1}.`).join('\n');
 const server=createServer((req,res)=>{req.resume();req.on('end',()=>{const number=++requests;const respond=()=>{if(res.writableEnded||res.destroyed)return;releaseReply=undefined;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:longAnswer+'\nREPLY '+number},finish_reason:'stop'}]}));};if(number===2)releaseReply=respond;else respond();});});
 await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));const address=server.address();if(!address||typeof address==='string')throw new Error('Fixture not listening');
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((item):item is [string,string]=>item[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;env.JECTIVE_ASSISTANT_SERVER=`http://127.0.0.1:${address.port}`;env.JECTIVE_ASSISTANT_TOKEN='t'.repeat(43);
 const app=await electron.launch({args:['.'],env});
 try{
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>{win.setFocusable(false);win.setPosition(-12000,-12000);win.webContents.setBackgroundThrottling(false);win.on('show',()=>win.setPosition(-12000,-12000));win.showInactive();}));
  const page=await app.firstWindow();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('header>label>select').selectOption('en');await page.locator('main>nav').getByRole('button',{name:'Ask for help',exact:true}).click();
  const chat=page.locator('.learner-chat'),question=chat.getByLabel('Question',{exact:true}),log=chat.getByRole('log');
  await question.fill('Explain this local fixture');await question.press('Control+Enter');await expect(chat.locator('.assistant-answer')).toContainText('REPLY 1');expect(requests).toBe(1);
  for(const [width,height] of [[1200,800],[800,700]] as const){
   await page.setViewportSize({width,height});
   const metrics=await page.evaluate(()=>{const composer=document.querySelector('.chat-composer')!,log=document.querySelector('.chat-transcript')!,input=document.querySelector('.chat-composer textarea')!;return {pageHeight:document.documentElement.scrollHeight,viewportHeight:innerHeight,pageWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,composerBottom:composer.getBoundingClientRect().bottom,inputTop:input.getBoundingClientRect().top,inputBottom:input.getBoundingClientRect().bottom,logScrollHeight:log.scrollHeight,logHeight:log.clientHeight};});
   expect(metrics.pageHeight).toBeLessThanOrEqual(height+2);expect(metrics.pageWidth).toBeLessThanOrEqual(width);expect(metrics.inputTop).toBeGreaterThan(68);expect(metrics.composerBottom).toBeLessThanOrEqual(height-(width<=800?62:0));expect(metrics.logScrollHeight).toBeGreaterThan(metrics.logHeight);
  }
  await question.fill('A second request while reading');await question.press('Control+Enter');await expect(question).toBeDisabled();await expect.poll(()=>requests).toBe(2);
  await log.hover();await page.mouse.wheel(0,-100000);await expect.poll(()=>log.evaluate(element=>element.scrollTop)).toBe(0);
  releaseReply!();await expect(chat.locator('.assistant-answer')).toContainText('REPLY 2');expect(await log.evaluate(element=>element.scrollTop)).toBe(0);
  await expect(chat.getByRole('log')).toContainText('A second request while reading');await page.screenshot({path:'test-results/assistant-chat-layout-800.png',animations:'disabled'});
  await chat.getByRole('button',{name:'New conversation',exact:true}).click();await expect(question).toHaveValue('');await expect(log).not.toContainText('REPLY');expect(errors).toEqual([]);
 }finally{
  releaseReply?.();await app.evaluate(({app})=>app.exit(0)).catch(()=>{});if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));server.closeAllConnections();await new Promise<void>(done=>server.close(()=>done()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-chat-layout-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});
 }
});
