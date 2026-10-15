import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {join,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';

test('launch inspiration appears with the logo, rotates on reload and never occupies a lesson',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-launch-inspiration-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',dialog=>{if(dialog.type()!=='beforeunload')void dialog.accept();});await app.evaluate(({BrowserWindow,dialog})=>{dialog.showMessageBoxSync=()=>1;const window=BrowserWindow.getAllWindows()[0]!;window.setFocusable(false);window.setPosition(-12000,-12000);window.webContents.setBackgroundThrottling(false);window.showInactive();});
  // Record the actual early DOM on subsequent launches, without extending startup or changing its clock.
  await page.addInitScript(()=>{
   sessionStorage.removeItem('launch-first-observed');
   const observer=new MutationObserver(()=>{const figure=document.querySelector<HTMLElement>('.launch-motivation');if(figure?.querySelector('blockquote')?.textContent){const record=JSON.stringify({id:figure.dataset.motivationId,text:figure.textContent,logo:!!document.querySelector('#launch-screen img'),lang:figure.parentElement?.lang,rootExists:!!document.getElementById('root'),rootHadContent:!!document.getElementById('root')?.firstElementChild});if(!sessionStorage.getItem('launch-first-observed'))sessionStorage.setItem('launch-first-observed',record);sessionStorage.setItem('launch-observed',record);}});
   observer.observe(document,{childList:true,subtree:true,characterData:true});
  });
  await expect(page.locator('#launch-screen')).toHaveCount(0);const first=await page.evaluate(()=>localStorage.getItem('jective-launch-motivation'));expect(first).toBeTruthy();
  await mkdir('test-results/launch-motivation',{recursive:true});
  await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('.launch-motivation blockquote')).not.toBeEmpty();await page.screenshot({path:'test-results/launch-motivation/splash.png',animations:'disabled'});await expect(page.locator('#launch-screen')).toHaveCount(0);
  const observed=JSON.parse(await page.evaluate(()=>sessionStorage.getItem('launch-observed'))??'null');expect(observed).toMatchObject({logo:true,lang:'ru'});expect(observed.id).not.toBe(first);expect(observed.text.length).toBeGreaterThan(15);
  const early=JSON.parse(await page.evaluate(()=>sessionStorage.getItem('launch-first-observed'))??'null');expect(early).toMatchObject({logo:true,rootExists:true,rootHadContent:false,id:observed.id});
  await expect(page.locator('.daily-greeting,.launch-motivation')).toHaveCount(0);expect(await page.evaluate(()=>window.jective.activity())).toEqual({ok:true,value:{}});
  await mkdir('test-results/launch-motivation',{recursive:true});await page.screenshot({path:'test-results/launch-motivation/lesson-without-greeting.png',animations:'disabled'});
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-launch-inspiration-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
