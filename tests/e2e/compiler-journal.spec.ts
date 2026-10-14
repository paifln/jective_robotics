import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {randomUUID} from 'node:crypto';

test('compiler journal preview pages, keyboard navigation, localized labels and export request',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-journal-ui-')),env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((x):x is [string,string]=>x[1]!==undefined));env.JECTIVE_WORKSPACE_ROOT=root;delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.setPosition(-12000,-12000);w.webContents.setBackgroundThrottling(false);w.showInactive();}));
  await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('main>header>label>select').selectOption('en');await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();
  const unknown=await page.evaluate(id=>window.jective.journalPage(id,0),randomUUID());expect(unknown.ok).toBe(false);if(!unknown.ok)expect(unknown.error.code).toBe('PROCESS_LOG_UNAVAILABLE');
  // Explicit IPC response fixtures exercise the actual sandboxed preload and UI.
  // Domain filesystem and ownership checks have separate unit/lifecycle tests.
  const id=randomUUID();await app.evaluate(({ipcMain},id)=>{
   for(const channel of ['build:compile','build:journalPage','build:journalExport'])ipcMain.removeHandler(channel);
   ipcMain.handle('build:compile',()=>({ok:true,value:{operationId:id,state:'failed',log:'Explicit failed-build fixture',sourceHash:'a'.repeat(64),artifacts:[],exitCode:1}}));
   let failFirst=true;
   ipcMain.handle('build:journalPage',(_event,request)=>{if(failFirst){failFirst=false;return {ok:false,error:{code:'PROCESS_LOG_UNAVAILABLE',message:'Explicit first-page read failure fixture'}};}return {ok:true,value:{text:request.offset===0?'FIRST Ж😀':'LAST Қазақша',offset:request.offset,nextOffset:request.offset===0?65536:70000,totalBytes:70000,complete:request.offset!==0}};});
   ipcMain.handle('build:journalExport',(_event,operationId)=>({ok:operationId===id,value:false}));
  },id);
  await page.locator('.studio-actions').getByRole('button',{name:'Compile — check code for the board',exact:true}).click();
  const panel=page.locator('.compiler-journal');await expect(panel).toBeVisible();const summary=panel.locator('summary');await summary.focus();await page.keyboard.press('Enter');await expect(panel.getByRole('alert')).toBeVisible();await expect(panel.locator('pre')).toHaveCount(0);await panel.getByRole('button',{name:'Try reading again',exact:true}).click();await expect(panel.locator('pre')).toHaveText('FIRST Ж😀');await expect(panel.getByRole('alert')).toHaveCount(0);await expect(panel.getByRole('button',{name:'Try reading again',exact:true})).toHaveCount(0);await expect(panel).toContainText('local file paths');
  await expect(panel.getByRole('button',{name:'Previous',exact:true})).toBeDisabled();await panel.getByRole('button',{name:'Next',exact:true}).click();await expect(panel.locator('pre')).toHaveText('LAST Қазақша');await expect(panel.getByRole('button',{name:'Next',exact:true})).toBeDisabled();await panel.getByRole('button',{name:'Previous',exact:true}).click();await expect(panel.locator('pre')).toHaveText('FIRST Ж😀');
  await page.setViewportSize({width:800,height:700});await panel.scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const controls=await panel.locator('.toolbar').boundingBox(),nav=await page.locator('main>nav').boundingBox();expect(controls).not.toBeNull();expect(nav).not.toBeNull();expect(controls!.y+controls!.height).toBeLessThanOrEqual(nav!.y);
  await mkdir('test-results/compiler-journal-ui',{recursive:true});await page.screenshot({path:'test-results/compiler-journal-ui/journal-light.png'});await page.getByRole('button',{name:'Color theme',exact:true}).click();await panel.scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/compiler-journal-ui/journal-dark.png'});
  await panel.getByRole('button',{name:'Save full log…',exact:true}).click();await expect(panel.getByRole('button',{name:'Save full log…',exact:true})).toBeEnabled();
  for(const [locale,label] of [['ru','Полный журнал компилятора'],['kk','Компилятордың толық журналы']] as const){await page.locator('main>header>label>select').selectOption(locale);await expect(summary).toHaveText(label);}
  await app.evaluate(({ipcMain})=>{ipcMain.removeHandler('build:journalPage');ipcMain.handle('build:journalPage',()=>({ok:true,value:{text:'invalid',offset:0,nextOffset:1,totalBytes:1,complete:'invalid'}}));});
  await panel.getByRole('button',{name:'Келесі',exact:true}).click();await expect(panel.getByRole('alert')).toBeVisible();await expect(panel.locator('pre')).toHaveText('FIRST Ж😀');
  await expect(panel.getByRole('button',{name:'Артқа',exact:true})).toBeDisabled();
  for(const value of [
   {text:'stalled',offset:0,nextOffset:0,totalBytes:70000,complete:false},
   {text:'backwards',offset:20,nextOffset:10,totalBytes:70000,complete:false},
   {text:'wrong end',offset:0,nextOffset:10,totalBytes:70000,complete:true},
   {text:'oversized page',offset:0,nextOffset:65537,totalBytes:70000,complete:false}
  ]){
   await app.evaluate(({ipcMain},value)=>{ipcMain.removeHandler('build:journalPage');ipcMain.handle('build:journalPage',()=>({ok:true,value}));},value);
   expect(await page.evaluate(async id=>{try{await window.jective.journalPage(id,0);return false;}catch{return true;}},id)).toBe(true);
  }
 }finally{
  await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-journal-ui-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
