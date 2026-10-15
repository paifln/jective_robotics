import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';

test('simulation suspends while minimized and keeps explicit user pause after restore',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-simulator-visibility-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>{const window=BrowserWindow.getAllWindows()[0]!;window.setFocusable(false);window.setPosition(-12000,-12000);window.webContents.setBackgroundThrottling(false);window.showInactive();});await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('main>header>label>select').selectOption('en');await page.emulateMedia({reducedMotion:'reduce'});await page.locator('main>nav').getByRole('button',{name:'Simulator',exact:true}).click();
  const panel=page.locator('.simulator-workspace'),time=async()=>parseInt(await panel.locator('.simulation-readings>div').nth(1).locator('strong').innerText(),10);
  await panel.getByRole('button',{name:'Run',exact:true}).click();await expect.poll(time).toBeGreaterThan(100);
  await page.getByRole('button',{name:'Minimize window',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-window-hidden','true');
  await page.waitForTimeout(100);const paused=await time();await page.waitForTimeout(300);expect(await time()).toBe(paused);
  await app.evaluate(({BrowserWindow})=>{const window=BrowserWindow.getAllWindows()[0]!;window.restore();window.setPosition(-12000,-12000);});await expect(page.locator('html')).toHaveAttribute('data-window-hidden','false');await expect.poll(time).toBeGreaterThan(paused);
  await panel.getByRole('button',{name:'Pause',exact:true}).click();await page.waitForTimeout(100);const explicit=await time();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0]!.minimize());await expect(page.locator('html')).toHaveAttribute('data-window-hidden','true');await app.evaluate(({BrowserWindow})=>{const window=BrowserWindow.getAllWindows()[0]!;window.restore();window.setPosition(-12000,-12000);});await expect(page.locator('html')).toHaveAttribute('data-window-hidden','false');await page.waitForTimeout(300);expect(await time()).toBe(explicit);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-simulator-visibility-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
