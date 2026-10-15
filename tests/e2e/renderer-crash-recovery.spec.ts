import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {randomUUID} from 'node:crypto';

test('an actual renderer crash offers branded recovery and preserves the last local autosave',async()=>{
 test.setTimeout(90000);const root=await mkdtemp(join(tmpdir(),'jective-renderer-recovery-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await expect(page.locator('#launch-screen')).toHaveCount(0);
  const source='void setup() {}\nvoid loop() { /* last actual local autosave */ }';
  const saved=await page.evaluate(project=>window.jective.autosave(project),{schemaVersion:1,id:randomUUID(),name:'Crash recovery sentinel',profileId:'esp32-devkit-reference',mode:'code',source,workspace:{},revision:0} as const);expect(saved.ok).toBe(true);
  const previousPid=await app.evaluate(({BrowserWindow,dialog})=>{
   const window=BrowserWindow.getAllWindows()[0]!;window.setFocusable(false);window.setPosition(-12000,-12000);window.webContents.setBackgroundThrottling(false);
   const state=globalThis as typeof globalThis&{recoveryPrompts:number;recoveryBranded:boolean};state.recoveryPrompts=0;state.recoveryBranded=false;
   dialog.showMessageBox=async(...args:unknown[])=>{const options=args.at(-1) as {icon?:{isEmpty:()=>boolean}};state.recoveryPrompts++;state.recoveryBranded=Boolean(options.icon&&!options.icon.isEmpty());return {response:0,checkboxChecked:false};};
   // Explicit acceptance applies only to this fixture's restored-project prompt.
   window.webContents.once('dom-ready',()=>{void window.webContents.executeJavaScript('window.confirm=()=>true');});
   return window.webContents.getOSProcessId();
  });
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0]!.webContents.forcefullyCrashRenderer());
  await expect.poll(()=>app.evaluate(()=>(globalThis as typeof globalThis&{recoveryPrompts:number}).recoveryPrompts)).toBe(1);
  await expect.poll(()=>app.evaluate(({BrowserWindow},previous)=>{const pid=BrowserWindow.getAllWindows()[0]!.webContents.getOSProcessId();return pid>0&&pid!==previous;},previousPid)).toBe(true);
  // Read the recovered DOM through main: Playwright's original page legitimately emitted crash.
  await expect.poll(()=>app.evaluate(async({BrowserWindow})=>{const window=BrowserWindow.getAllWindows()[0]!;try{return await window.webContents.executeJavaScript('({ready:!document.getElementById("launch-screen"),name:document.querySelector(".workspace-heading h1")?.textContent,chrome:!!document.querySelector(".window-chrome")})');}catch{return null;}}),{timeout:15000}).toEqual({ready:true,name:'Crash recovery sentinel',chrome:true});
  expect(await app.evaluate(()=>(globalThis as typeof globalThis&{recoveryBranded:boolean}).recoveryBranded)).toBe(true);
  const recovery=await app.evaluate(async({BrowserWindow})=>BrowserWindow.getAllWindows()[0]!.webContents.executeJavaScript('window.jective.workspace()'));expect(recovery.ok&&recovery.value.recovery.source).toBe(source);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-renderer-recovery-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
