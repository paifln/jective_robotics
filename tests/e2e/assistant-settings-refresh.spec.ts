import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';

test('online assistant disables requests after settings validation fails and recovers on refresh',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-assistant-refresh-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await app.evaluate(({BrowserWindow,ipcMain})=>{
   BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.setPosition(-12000,-12000);w.webContents.setBackgroundThrottling(false);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();});
   const state=globalThis as typeof globalThis&{settingsInvalid:boolean;hintRequests:number};state.settingsInvalid=false;state.hintRequests=0;
   ipcMain.removeHandler('assistant:settings');ipcMain.handle('assistant:settings',()=>({ok:true,value:state.settingsInvalid?'TEST ONLY INVALID SETTINGS':{enabled:true,keyConfigured:true,endpoint:'https://api.openai.com/v1',model:'test-only-fixture'}}));
   ipcMain.removeHandler('assistant:ask');ipcMain.handle('assistant:ask',()=>{state.hintRequests++;return {ok:true,value:'TEST ONLY ANSWER'};});
  });
  await page.locator('main>header>label>select').selectOption('en');
  await page.locator('main>nav').getByRole('button',{name:'Ask for help',exact:true}).click();await expect(page.locator('.learner-chat')).toBeVisible();
  const chat=page.locator('.learner-chat'),request=chat.getByRole('button',{name:'Request hint',exact:true});await chat.getByLabel('Question',{exact:true}).fill('Test question, no live provider');
  await expect(request).toBeEnabled();
  await app.evaluate(()=>{(globalThis as typeof globalThis&{settingsInvalid:boolean}).settingsInvalid=true;});
  await page.evaluate(()=>window.dispatchEvent(new Event('assistant-settings-changed')));
  await expect(request).toBeDisabled();await expect(chat.locator('.assistant-settings-status')).toContainText('Could not check assistant settings');
  expect(errors).toEqual([]);expect(await app.evaluate(()=>(globalThis as typeof globalThis&{hintRequests:number}).hintRequests)).toBe(0);
  await app.evaluate(()=>{(globalThis as typeof globalThis&{settingsInvalid:boolean}).settingsInvalid=false;});
  await page.evaluate(()=>window.dispatchEvent(new Event('assistant-settings-changed')));await expect(request).toBeEnabled();
  await request.click();await expect(chat.locator('.assistant-answer')).toHaveText('TEST ONLY ANSWER');
  await expect(chat.getByRole('status').last()).toContainText('Check the suggestion before use');
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(request).toBeEnabled();
  await expect(chat.getByRole('status').last()).toContainText('Check the suggestion before use');
  await app.evaluate(()=>{(globalThis as typeof globalThis&{settingsInvalid:boolean}).settingsInvalid=true;});await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(request).toBeDisabled();await expect(chat.locator('.assistant-settings-status')).toContainText('Could not check assistant settings');await expect(chat.locator('.assistant-request-status')).toContainText('Check the suggestion before use');await expect(chat.locator('.assistant-answer')).toHaveText('TEST ONLY ANSWER');
  await app.evaluate(()=>{(globalThis as typeof globalThis&{settingsInvalid:boolean}).settingsInvalid=false;});await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(request).toBeEnabled();await expect(chat.locator('.assistant-settings-status')).toHaveCount(0);
  expect(await app.evaluate(()=>(globalThis as typeof globalThis&{hintRequests:number}).hintRequests)).toBe(1);expect(errors).toEqual([]);
  // Explicit provider-error response fixtures; no real API request or secret.
  for(const [locale,code,button,expected] of [
   ['en','AI_PROVIDER_HTTP_401','Request hint','did not accept the API key'],
   ['ru','AI_PROVIDER_HTTP_429','Запросить подсказку','ограничивает запросы'],
   ['kk','AI_PROVIDER_HTTP_503','Кеңес сұрау','Онлайн көмек қолжетімсіз']
  ] as const){
   await page.locator('main>header>label>select').selectOption(locale);
   await app.evaluate(({ipcMain},code)=>{ipcMain.removeHandler('assistant:ask');ipcMain.handle('assistant:ask',()=>({ok:false,error:{code,message:'PRIVATE TEST DIAGNOSTIC: dummy key and source path'}}));},code);
   const retry=chat.getByRole('button',{name:button,exact:true});await expect(retry).toBeEnabled();await retry.click();
   await expect(chat.getByRole('status').last()).toContainText(expected);await expect(chat.getByRole('status').last()).not.toContainText('PRIVATE TEST DIAGNOSTIC');await expect(chat.getByRole('status').last()).not.toContainText(code);await expect(chat.locator('.assistant-answer')).toHaveText('');await expect(retry).toBeEnabled();
   await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(retry).toBeEnabled();await expect(chat.getByRole('status').last()).toContainText(expected);
   if(locale==='en'){await page.locator('main>header>label>select').selectOption('ru');await expect(chat.locator('.assistant-request-status')).toContainText('API-ключ');}
  }
  expect(errors).toEqual([]);
 }finally{
  if(app.process().exitCode===null&&app.process().signalCode===null)await app.evaluate(({app})=>app.exit(0)).catch(()=>{});
  if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-assistant-refresh-'))throw new Error('UNSAFE_CLEANUP');
  await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
