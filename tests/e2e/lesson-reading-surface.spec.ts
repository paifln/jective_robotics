import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';

test('theory, offline audio and text controls are visible, and subject photos load in both themes',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-reading-surface-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((item):item is [string,string]=>item[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>{win.setFocusable(false);win.setPosition(-12000,-12000);win.webContents.setBackgroundThrottling(false);win.on('show',()=>win.setPosition(-12000,-12000));win.showInactive();}));
  const page=await app.firstWindow();await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('header>label>select').selectOption('en');
  await expect(page.getByLabel('Text size',{exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Reading settings',exact:true}).click();await expect(page.getByLabel('Text size',{exact:true})).toBeVisible();await page.getByLabel('Text size',{exact:true}).selectOption('24');await expect(page.locator('.reading-tools audio')).toHaveCount(1);await expect(page.locator('.reading-tools audio')).toBeHidden();
  await expect(page.locator('.learning-exercise .learning-option').first()).toHaveCSS('font-size','24px');
  await page.getByRole('checkbox',{name:'Reduce motion',exact:true}).check();await expect(page.locator('body')).toHaveAttribute('data-reading-still','true');await page.keyboard.press('Escape');
  await page.locator('.library-layout>aside>button').nth(4).click();await expect(page.locator('.component-photo img')).toHaveCount(2);
  await page.locator('.content>.toolbar').getByRole('button',{name:'Programming',exact:true}).click();
  for(const id of ['L02','L03','L09']){
   await page.getByRole('button',{name:new RegExp('^'+id+' ·')}).click();await expect(page.locator('.lesson-illustration')).toHaveCount(0);
   const theory=page.locator('.student-theory-notes>details');await expect(theory).toHaveAttribute('open','');await expect(theory.locator('p').first()).toBeVisible();
   const photos=page.locator('.component-photo img');await expect(photos).toHaveCount(id==='L03'?2:1);
   for(const theme of ['light','dark']){
    if(await page.locator('body').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'Color theme',exact:true}).click();
    for(const photo of await photos.all()){await photo.scrollIntoViewIfNeeded();await expect.poll(()=>photo.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);}
   }
  }
  await page.locator('.student-theory-notes').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/lesson-reading-surface.png',animations:'disabled'});
  const task=page.locator('.student-task');await expect(task).toHaveCSS('border-left-width','3px');await expect(task.locator('h4').first()).toHaveCSS('color',await page.locator('.lesson-heading h3').evaluate(el=>getComputedStyle(el).color));
  await page.locator('main>nav').getByRole('button',{name:'Simulator',exact:true}).click();await expect(page.getByLabel('Scenario JSON',{exact:true})).toHaveCount(0);await expect(page.locator('.world-designer')).toBeAttached();
 }finally{
  await app.evaluate(({app})=>app.exit(0)).catch(()=>{});if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-reading-surface-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});
 }
});
