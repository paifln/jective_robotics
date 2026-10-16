import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {randomUUID} from 'node:crypto';

test('failed workspace read blocks empty autosave and retry can restore the existing project',async()=>{
 test.setTimeout(90000);const root=await mkdtemp(join(tmpdir(),'jective-startup-recovery-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',dialog=>{if(dialog.type()!=='beforeunload')void dialog.accept();});
  await app.evaluate(({BrowserWindow,dialog})=>{dialog.showMessageBoxSync=()=>1;const window=BrowserWindow.getAllWindows()[0]!;window.setFocusable(false);window.setPosition(-12000,-12000);window.webContents.setBackgroundThrottling(false);window.showInactive();});
  await expect(page.locator('#launch-screen')).toHaveCount(0);
  const source='void setup() {}\nvoid loop() { /* preserved recovery sentinel */ }';
  const saved=await page.evaluate(project=>window.jective.autosave(project),{schemaVersion:1,id:randomUUID(),name:'Existing recovery',profileId:'esp32-devkit-reference',mode:'code',source,workspace:{},revision:0} as const);expect(saved.ok).toBe(true);
  const before=await page.evaluate(()=>window.jective.workspace());if(!before.ok)throw new Error('FIXTURE_WORKSPACE_UNAVAILABLE');expect(before.value.recovery?.source).toBe(source);
  await app.evaluate(({ipcMain})=>{const state=globalThis as typeof globalThis&{startupAutosaves:number};state.startupAutosaves=0;ipcMain.removeHandler('workspace:state');ipcMain.handle('workspace:state',()=>({ok:false,error:{code:'EXPLICIT_WORKSPACE_READ_FIXTURE',message:'EXPLICIT_WORKSPACE_READ_FIXTURE'}}));ipcMain.removeHandler('workspace:autosave');ipcMain.handle('workspace:autosave',()=>{state.startupAutosaves++;return {ok:true,value:true};});});
  await page.reload();await expect(page.locator('#launch-screen')).toHaveCount(0);await expect(page.locator('main.recovery-screen')).toHaveAttribute('data-failure','workspace');await expect(page.locator('main.recovery-screen')).toContainText('Пустая рабочая область не записывается поверх них');await expect(page.getByRole('button',{name:'Закрыть окно',exact:true})).toBeVisible();await expect(page.locator('.studio')).toHaveCount(0);
  // Exceed the normal two-second autosave delay; an empty fallback must never be written.
  await page.waitForTimeout(2300);expect(await app.evaluate(()=>(globalThis as typeof globalThis&{startupAutosaves:number}).startupAutosaves)).toBe(0);
  await app.evaluate(({ipcMain},state)=>{ipcMain.removeHandler('workspace:state');ipcMain.handle('workspace:state',()=>({ok:true,value:state}));},before.value);
  await page.getByRole('button',{name:'Попробовать снова',exact:true}).click();await expect(page.locator('#launch-screen')).toHaveCount(0);await expect(page.locator('main.recovery-screen')).toHaveCount(0);await page.locator('main>nav').getByRole('button',{name:'Студия',exact:true}).click();await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',source);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-startup-recovery-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});

test('unsupported recovery blocks stop startup without overwriting the saved project and allow repair',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-startup-recovery-')),env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',dialog=>{if(dialog.type()!=='beforeunload')void dialog.accept();});await app.evaluate(({BrowserWindow,dialog})=>{dialog.showMessageBoxSync=()=>1;const window=BrowserWindow.getAllWindows()[0]!;window.setFocusable(false);window.setPosition(-12000,-12000);window.webContents.setBackgroundThrottling(false);window.showInactive();});await expect(page.locator('#launch-screen')).toHaveCount(0,{timeout:20000});
  await expect.poll(async()=>{const state=await page.evaluate(()=>window.jective.workspace());return state.ok?state.value.recovery?.id:null;}).toBeTruthy();
  const project={schemaVersion:1 as const,id:randomUUID(),name:'Recovery must remain',profileId:'esp32-devkit-reference',mode:'blocks' as const,source:'// preserved recovery source',workspace:{blocks:{languageVersion:0,blocks:[{type:'unknown_untrusted_recovery_block'}]}},revision:0};expect((await page.evaluate(value=>window.jective.autosave(value),project)).ok).toBe(true);
  await page.reload();await expect(page.locator('main.recovery-screen')).toHaveAttribute('data-failure','workspace');await expect(page.locator('.studio')).toHaveCount(0);
  // Wait past the normal autosave delay to detect an unwanted blank replacement.
  await page.waitForTimeout(2300);const state=await page.evaluate(()=>window.jective.workspace());expect(state.ok&&state.value.recovery?.id).toBe(project.id);expect(state.ok&&state.value.recovery?.source).toBe(project.source);
  const repaired={...project,mode:'code' as const,workspace:{}};expect((await page.evaluate(value=>window.jective.autosave(value),repaired)).ok).toBe(true);await page.getByRole('button',{name:'Попробовать снова',exact:true}).click();await expect(page.locator('#launch-screen')).toHaveCount(0,{timeout:20000});await expect(page.locator('main.recovery-screen')).toHaveCount(0);await page.locator('main>nav').getByRole('button',{name:'Студия',exact:true}).click();await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',project.source);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-startup-recovery-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
