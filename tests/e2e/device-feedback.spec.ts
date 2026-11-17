import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';

test('invalid port replies are explained safely, stale selections clear and USB controls remain retryable',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-device-feedback-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await app.evaluate(({BrowserWindow,ipcMain})=>{
   const window=BrowserWindow.getAllWindows()[0]!;window.setFocusable(false);window.setPosition(-12000,-12000);window.webContents.setBackgroundThrottling(false);window.showInactive();
   const state=globalThis as typeof globalThis&{portFixtureValid:boolean};state.portFixtureValid=false;
   ipcMain.removeHandler('devices:list');ipcMain.handle('devices:list',()=>({ok:true,value:state.portFixtureValid?[{path:'COM_EXPLICIT_TEST_ONLY'}]:[{path:123,manufacturer:'UNTRUSTED_DEVICE_PAYLOAD'}]}));
   ipcMain.removeHandler('serial:open');ipcMain.handle('serial:open',()=>{throw new Error('UNTRUSTED_DEVICE_PAYLOAD');});
  });
  await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('main>header>label>select').selectOption('en');await page.locator('main>nav').getByRole('button',{name:'Serial Monitor',exact:true}).click();
  const monitor=page.locator('.serial-workspace .board-monitor');await expect(monitor).toBeVisible();await expect(monitor.getByRole('alert')).toContainText('Could not communicate with the board tools');
  await app.evaluate(()=>(globalThis as typeof globalThis&{portFixtureValid:boolean}).portFixtureValid=true);await monitor.getByRole('button',{name:'Refresh ports',exact:true}).click();await monitor.getByLabel('Port',{exact:true}).selectOption('COM_EXPLICIT_TEST_ONLY');await monitor.getByRole('button',{name:'Open monitor',exact:true}).click();await expect(monitor.getByRole('alert')).toContainText('Could not communicate with the board tools');await expect(monitor).not.toContainText('UNTRUSTED_DEVICE_PAYLOAD');await expect(monitor.getByRole('button',{name:'Open monitor',exact:true})).toBeEnabled();await expect(monitor).toContainText('Monitor closed');
  await app.evaluate(()=>(globalThis as typeof globalThis&{portFixtureValid:boolean}).portFixtureValid=false);await monitor.getByRole('button',{name:'Refresh ports',exact:true}).click();await expect(monitor.getByLabel('Port',{exact:true})).toHaveValue('');await expect(monitor.getByLabel('Port',{exact:true}).locator('option')).toHaveCount(1);
  expect(errors).toEqual([]);expect(await page.evaluate(()=>window.jective.activity())).toEqual({ok:true,value:{}});
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-device-feedback-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
