import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {openAssistant} from './helpers/assistant';
import {englishWorkspace} from './helpers/learning';

test('managed chat rejects malformed replies without exposing configuration or secrets and permits retry',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-assistant-setup-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;delete env.JECTIVE_ASSISTANT_SERVER;delete env.JECTIVE_ASSISTANT_TOKEN;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await app.evaluate(({BrowserWindow,ipcMain})=>{
   const window=BrowserWindow.getAllWindows()[0]!;window.setFocusable(false);window.setPosition(-12000,-12000);window.webContents.setBackgroundThrottling(false);window.showInactive();
   const state=globalThis as typeof globalThis&{setupRequests:{history?:unknown[]}[]};state.setupRequests=[];
   ipcMain.removeHandler('assistant:settings');ipcMain.handle('assistant:settings',()=>({ok:true,value:{enabled:true,keyConfigured:true,endpoint:'https://assistant.example.invalid',model:'jective-managed'}}));
   ipcMain.removeHandler('assistant:ask');ipcMain.handle('assistant:ask',(_event,value:{history?:unknown[]})=>{state.setupRequests.push(value);return state.setupRequests.length===1?{ok:true,value:{apiKey:'TEST_ONLY_DUMMY_SECRET'}}:{ok:true,value:'EXPLICIT VALID RETRY FIXTURE'};});
  });
  await englishWorkspace(page);await page.evaluate(()=>window.dispatchEvent(new Event('assistant-settings-changed')));await openAssistant(page);
  const chat=page.locator('.learner-chat'),send=chat.getByRole('button',{name:'Request hint',exact:true});
  await chat.getByLabel('Question',{exact:true}).fill('Explain this task');await send.click();await expect(chat.getByRole('status').last()).toContainText('The request failed. Try again.');await expect(send).toBeEnabled();await expect(chat.getByLabel('Question',{exact:true})).toHaveValue('Explain this task');await expect(page.locator('body')).not.toContainText('TEST_ONLY_DUMMY_SECRET');await expect(chat.locator('.assistant-answer')).toBeEmpty();
  await send.click();await expect(chat.locator('.assistant-answer')).toHaveText('EXPLICIT VALID RETRY FIXTURE');const requests=await app.evaluate(()=>(globalThis as typeof globalThis&{setupRequests:{history?:unknown[]}[]}).setupRequests);expect(requests).toHaveLength(2);expect(requests[1]!.history).toEqual([]);
  await page.getByRole('button',{name:'Help',exact:true}).click();await expect(page.locator('.assistant-setup')).toHaveCount(0);await expect(page.getByLabel('API key',{exact:true})).toHaveCount(0);await expect(page.getByLabel('OpenAI model',{exact:true})).toHaveCount(0);await expect(page.locator('input[type=password]')).toHaveCount(0);await expect(readFile(join(root,'assistant.json'),'utf8')).rejects.toHaveProperty('code','ENOENT');expect(errors).toEqual([]);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-assistant-setup-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
