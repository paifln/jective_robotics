import {englishWorkspace} from './helpers/learning';
import {parkVerificationWindow} from './helpers/window';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('Jective launches with blue branding and a focused, responsive block workspace',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-design-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);page.on('dialog',d=>d.accept());
  const splash=page.locator('#launch-screen');await expect(splash).toBeVisible();await expect(splash).toHaveCSS('background-color','rgb(33, 29, 255)');await expect(splash.locator('img')).toHaveCSS('filter','brightness(0) invert(1)');await page.screenshot({path:'test-results/design-splash.png'});
  await expect(splash).toHaveCount(0);await englishWorkspace(page);await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await expect(page.locator('body')).toHaveAttribute('data-theme','light');
  await expect(page.locator('.view-blocks')).toBeVisible();await expect(page.locator('.monaco-editor')).not.toBeVisible();await expect(page.locator('.blocklyToolbox')).toContainText('Sensors');
  await expect(page.getByRole('navigation',{name:'Workspace sections'})).not.toContainText(' / ');
  await page.screenshot({path:'test-results/design-studio.png'});
  await page.getByRole('button',{name:'Code',exact:true}).click();await expect(page.locator('.monaco-editor')).toBeVisible();await expect(page.locator('.blocklySvg').first()).not.toBeVisible();
  await page.getByRole('button',{name:'Blocks',exact:true}).click();await expect(page.locator('.blocklySvg').first()).toBeVisible();
  await page.getByRole('button',{name:'Run blocks in simulator',exact:true}).click();await expect(page.getByRole('heading',{name:'Robot simulator',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Learn',exact:true}).click();await page.locator('.content>.toolbar').getByRole('button',{name:'Programming',exact:true}).click();await page.getByRole('button',{name:'Start the task in Studio',exact:true}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:'Start the task in Studio',exact:true})).toBeInViewport();
  await page.getByRole('button',{name:'Studio',exact:true}).click();await page.setViewportSize({width:1000,height:650});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await expect(page.getByRole('button',{name:'Run blocks in simulator',exact:true})).toBeInViewport();
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Color theme',exact:true}).click();await expect(page.locator('body')).toHaveAttribute('data-theme','dark');
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
