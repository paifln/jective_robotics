import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('selected theme persists across a real Electron process restart',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-theme-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 let app=await electron.launch({args:['.'],env});
 try{
  let page=await app.firstWindow();page.on('dialog',d=>d.dismiss());
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.setPosition(-12000,-12000);w.webContents.setBackgroundThrottling(false);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));
  await page.locator('main>header>label>select').selectOption('en');
  await expect(page.locator('.content')).toBeVisible();
  const theme=page.getByRole('button',{name:'Color theme',exact:true});
  await expect(theme).toHaveAttribute('title','Dark theme');
  await expect(theme).toHaveAttribute('aria-pressed','true');
  await theme.click();
  await expect(theme).toHaveAttribute('title','Light theme');
  await expect(page.locator('body')).toHaveAttribute('data-theme','dark');
  await theme.click();
  await expect(theme).toHaveAttribute('title','Dark theme');
  await expect(theme).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('body')).toHaveAttribute('data-theme','light');
  await expect.poll(async()=>{const state=await page.evaluate(()=>window.jective.workspace());return state.ok?state.value.theme:null;}).toBe('light');
  await page.getByRole('combobox',{name:'Language',exact:true}).selectOption('kk');
  await expect(page.getByRole('button',{name:'Түс тақырыбы',exact:true})).toHaveAttribute('title','Қараңғы тақырып');
  await page.getByRole('combobox',{name:'Тіл',exact:true}).selectOption('ru');
  await expect(page.getByRole('button',{name:'Цветовая тема',exact:true})).toHaveAttribute('title','Тёмная тема');
  await page.getByRole('button',{name:'Звуки интерфейса',exact:true}).click();expect((await page.evaluate(()=>window.jective.preferences({role:'teacher'}))).ok).toBe(true);
  await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));app=await electron.launch({args:['.'],env});page=await app.firstWindow();page.on('dialog',d=>d.dismiss());
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.setPosition(-12000,-12000);w.webContents.setBackgroundThrottling(false);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));
  await expect(page.locator('body')).toHaveAttribute('data-theme','light');
  await expect(page.getByRole('button',{name:'Цветовая тема',exact:true})).toHaveAttribute('title','Тёмная тема');
  await expect(page.getByRole('button',{name:'Звуки интерфейса',exact:true})).toHaveAttribute('aria-pressed','false');const state=await page.evaluate(()=>window.jective.workspace());expect(state.ok&&state.value).toMatchObject({theme:'light',role:'teacher',locale:'ru'});
 }finally{await app.evaluate(({app})=>app.exit(0));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
