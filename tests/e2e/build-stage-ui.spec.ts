import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {randomUUID} from 'node:crypto';

test('validated build stages are localized and foreign or malformed events cannot replace the current log',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-stage-ui-')),env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((x):x is [string,string]=>x[1]!==undefined));env.JECTIVE_WORKSPACE_ROOT=root;delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.setPosition(-12000,-12000);w.webContents.setBackgroundThrottling(false);w.showInactive();}));
  await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('main>header>label>select').selectOption('en');await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();
  let id='';await expect.poll(async()=>{const value=await page.evaluate(()=>window.jective.workspace());id=value.ok?value.value.recovery?.id??'':'';return id;}).toMatch(/^[a-f0-9-]{36}$/);
  const emit=async(value:unknown)=>app.evaluate(({BrowserWindow},event)=>BrowserWindow.getAllWindows()[0]!.webContents.send('build:stage',event),value);
  const log=page.locator('.output>pre');
  for(const [locale,expected]of [['en','Checking toolchain files'],['ru','Проверяем файлы инструментов'],['kk','Құрастыру алдында құрал файлдарын']] as const){
   await page.locator('main>header>label>select').selectOption(locale);await emit({projectId:id,stage:'environment-before'});await expect(log).toContainText(expected);
  }
  const original=await log.textContent();await emit({projectId:randomUUID(),stage:'compile'});await expect(log).toHaveText(original!);await emit({projectId:id,stage:'succeeded'});await expect(log).toHaveText(original!);
  await page.locator('main>header>label>select').selectOption('en');
  await emit({projectId:id,stage:'environment-before',progress:{files:123,bytes:5*1024**2,elapsedMs:1500}});
  const progress=page.locator('.build-integrity-progress');await expect(progress).toContainText('Files checked: 123');await expect(progress).toHaveAttribute('aria-live','off');
  const phase=await log.textContent();await emit({projectId:id,stage:'environment-before',progress:{files:124,bytes:6*1024**2,elapsedMs:2000}});await expect(progress).toContainText('124');await expect(log).toHaveText(phase!);
  const count=await progress.textContent();for(const event of [{projectId:id,stage:'environment-before',progress:{files:-1,bytes:0,elapsedMs:0}},{projectId:id,stage:'compile',progress:{files:1,bytes:1,elapsedMs:1}},{projectId:randomUUID(),stage:'environment-before',progress:{files:999,bytes:0,elapsedMs:0}}]){await emit(event);await expect(progress).toHaveText(count!);}
  await page.locator('main>header>label>select').selectOption('en');await emit({projectId:id,stage:'environment-after'});await expect(log).toContainText('Checking that toolchain files stayed unchanged');
  await emit({projectId:id,stage:'artifacts'});await expect(log).toContainText('Checking the build result');await expect(log).not.toContainText('State: succeeded');await expect(progress).toBeHidden();
  // Explicit error-response fixture, not actual compiler or hardware acceptance.
  await app.evaluate(({ipcMain})=>{ipcMain.removeHandler('build:compile');ipcMain.handle('build:compile',()=>({ok:false,error:{code:'BUILD_ENVIRONMENT_CHANGED',message:'BUILD_ENVIRONMENT_CHANGED'}}));});
  for(const [locale,expected,command] of [['en','Upload is blocked','Compile — check code for the board'],['ru','Загрузка на плату заблокирована','Компилировать — проверить код для платы'],['kk','Тақшаға жүктеу бұғатталды','Компиляция — тақша кодын тексеру']] as const){
   await page.locator('main>header>label>select').selectOption(locale);
   await page.locator('.studio-actions').getByRole('button',{name:command,exact:true}).click();
   await expect(log).toContainText(expected);await expect(log).not.toContainText('State: succeeded');
   expect((await log.textContent())!.split('BUILD_ENVIRONMENT_CHANGED')).toHaveLength(2);
  }
 }finally{
  await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-stage-ui-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
