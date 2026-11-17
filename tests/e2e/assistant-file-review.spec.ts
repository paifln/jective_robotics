import {openAssistant} from './helpers/assistant';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import type {Project} from '../../packages/contracts';
test('Jexi attaches only the opted-in code source and cancels pending requests',async()=>{
 test.setTimeout(90000);const root=await mkdtemp(join(tmpdir(),'jective-review-ui-')),path=join(root,'program.json');
 const project:Project={schemaVersion:1,id:randomUUID(),name:'File review',profileId:'esp32-devkit-reference',mode:'code',source:'void setup(){}\nvoid loop(){}',sourceFiles:{'helper.cpp':'// original helper\n','config.h':'// private configuration\n'},workspace:{},revision:0};await writeFile(path,JSON.stringify(project));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;const app=await electron.launch({args:['.'],env});
 try{const page=await app.firstWindow();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await app.evaluate(({BrowserWindow,ipcMain,dialog},path)=>{
  BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.webContents.setBackgroundThrottling(false);w.setPosition(-12000,-12000);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();});dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});
  const state=globalThis as typeof globalThis&{reviewRequests:{question:string;context:string}[];releaseReview?:(value:{ok:true;value:string})=>void;deviceCommands:number};state.reviewRequests=[];state.deviceCommands=0;
  ipcMain.removeHandler('assistant:settings');ipcMain.handle('assistant:settings',()=>({ok:true,value:{enabled:true,keyConfigured:true,endpoint:'https://api.openai.com/v1',model:'test fixture'}}));
  ipcMain.removeHandler('assistant:ask');ipcMain.handle('assistant:ask',(_event,value:{question:string;context:string})=>{state.reviewRequests.push(value);return new Promise(resolve=>{state.releaseReview=resolve;});});
  for(const channel of ['build:compile','device:upload']){ipcMain.removeHandler(channel);ipcMain.handle(channel,()=>{state.deviceCommands++;throw new Error('DEVICE_COMMAND_FORBIDDEN_IN_REVIEW_TEST');});}
 },path);await expect(page.locator('#launch-screen')).toHaveCount(0,{timeout:20000});await page.evaluate(()=>{window.confirm=()=>true;window.dispatchEvent(new Event('assistant-settings-changed'));});await page.getByLabel('Язык',{exact:true}).selectOption('en');const nav=page.locator('main>nav');await nav.getByRole('button',{name:'Studio',exact:true}).click();await page.getByRole('button',{name:'Open project',exact:true}).click();
 await page.locator('.code-files').getByRole('tab',{name:'helper.cpp',exact:true}).click();
 await openAssistant(page);
 const chat=page.locator('.learner-chat');
 const share=chat.getByRole('checkbox',{name:/Add code from a file/});
 const source=chat.getByRole('combobox',{name:'Code source'});
 const question=chat.getByRole('textbox',{name:'Question'});
 const send=chat.getByRole('button',{name:'Request hint'});
 const contexts=()=>app.evaluate(()=>(globalThis as typeof globalThis&{reviewRequests:{context:string}[]}).reviewRequests.map(request=>request.context));
 const answer=async(text:string)=>app.evaluate((_electron,text)=>{
  (globalThis as typeof globalThis&{releaseReview:(result:{ok:true;value:string})=>void}).releaseReview({ok:true,value:text});
 },text);
 await expect(share).not.toBeChecked();
 await expect(source).toBeDisabled();
 await question.fill('Explain without code');
 await send.click();
 await expect.poll(contexts).toEqual(['']);
 await expect(share).toBeDisabled();
 await answer('First reply');
 await expect(chat.locator('.assistant-answer')).toHaveText('First reply');

 await share.check();
 await expect(source).toHaveValue('current');
 await expect(source.locator('option')).toHaveText(['Current','From file']);
 await question.fill('Explain the active file');
 await send.click();
 const current='Selected source file: helper.cpp\n// original helper\n';
 await expect.poll(contexts).toEqual(['',current]);
 await answer('Current file reply');
 await expect(chat.locator('.assistant-answer')).toHaveText('Current file reply');

 const picker=page.waitForEvent('filechooser');
 await source.selectOption('file');
 await (await picker).setFiles({name:'external.cpp',mimeType:'text/plain',buffer:Buffer.from('// external code')});
 await expect(source).toHaveValue('file');
 await expect(chat.getByRole('button',{name:'external.cpp'})).toBeVisible();
 await question.fill('Explain the external file');
 await send.click();
 await expect.poll(contexts).toEqual(['',current,'Selected source file: external.cpp\n// external code']);
 await chat.getByRole('button',{name:'Cancel request'}).click();
 await expect(chat).toContainText('Request cancelled');
 await answer('CANCELLED RESULT');
 await expect(chat.locator('.assistant-answer')).toHaveText('Current file reply');
 await expect(question).toBeEnabled();
 await expect(page.locator('.shared-source-preview, .chat-review, .offline-help')).toHaveCount(0);
 expect(await app.evaluate(()=>(globalThis as typeof globalThis&{deviceCommands:number}).deviceCommands)).toBe(0);
 expect(errors).toEqual([]);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
