import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';
import {join,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';

test('launch motivation stays out of lessons and factual notifications survive toast dismissal',async()=>{
 test.setTimeout(90000);const root=await mkdtemp(join(tmpdir(),'jective-engagement-')),file=join(root,'saved.json');
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  // Electron handles beforeunload through its native, explicitly stubbed confirmation.
  // A listener prevents Playwright from automatically dismissing the same dialog via CDP.
  page.on('dialog',dialog=>{if(dialog.type()!=='beforeunload')void dialog.accept();});
  await app.evaluate(({BrowserWindow,dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});dialog.showMessageBoxSync=()=>1;const window=BrowserWindow.getAllWindows()[0]!;window.setFocusable(false);window.setPosition(-12000,-12000);window.webContents.setBackgroundThrottling(false);window.showInactive();},file);
  await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('main>header>label>select').selectOption('en');
  await expect(page.locator('.daily-greeting')).toHaveCount(0);
  const activityBefore=await page.evaluate(()=>window.jective.activity());expect(activityBefore).toEqual({ok:true,value:{}});
  await page.reload();await expect(page.locator('#launch-screen')).toHaveCount(0);await expect(page.locator('.daily-greeting')).toHaveCount(0);expect(await page.evaluate(()=>window.jective.activity())).toEqual(activityBefore);
  await page.getByRole('button',{name:'Notifications',exact:true}).click();const history=page.getByRole('region',{name:'Notification history',exact:true});await expect(history).toContainText('All quiet.');await page.keyboard.press('Escape');await expect(history).toHaveCount(0);
  await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await page.locator('.studio-actions').getByRole('button',{name:'Save project',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Project saved'})).toBeVisible();await expect(page.locator('.notification-count')).toHaveText('1');
  await page.getByRole('button',{name:'Dismiss notification',exact:true}).click();await expect(page.locator('.studio-toast')).toHaveCount(0);await page.getByRole('button',{name:'Notifications',exact:true}).click();await expect(history).toContainText('Project saved');await expect(page.locator('.notification-count')).toHaveCount(0);await expect(history.locator('li')).toHaveCount(1);
  await page.locator('main>header>label>select').selectOption('ru');await expect(page.getByRole('region',{name:'История уведомлений',exact:true})).toContainText('Проект сохранён');await page.getByRole('button',{name:'Очистить',exact:true}).click();await expect(page.getByRole('region',{name:'История уведомлений',exact:true}).locator('li')).toHaveCount(0);await page.keyboard.press('Escape');
  await mkdir('test-results/engagement-shell',{recursive:true});await page.screenshot({path:'test-results/engagement-shell/studio-ru.png',animations:'disabled'});
  // A code-only project makes dirty source and close cancellation unambiguous.
  const project={schemaVersion:1,id:randomUUID(),name:'Unsaved close guard',profileId:'esp32-devkit-reference',mode:'code',source:'void setup() {}\nvoid loop() {}',workspace:{},revision:0};await writeFile(file,JSON.stringify(project));
  await app.evaluate(({dialog,BrowserWindow},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});dialog.showMessageBoxSync=()=>{BrowserWindow.getAllWindows()[0]!.setTitle('Close guard fixture');return 0;};},file);
  await page.locator('.studio-actions').getByRole('button',{name:'Открыть проект',exact:true}).click();await expect(page.locator('.studio .monaco-editor')).toBeVisible();await page.locator('.studio .monaco-editor textarea').fill('// changed locally');
  await page.getByRole('button',{name:'Закрыть окно',exact:true}).click();await expect(page.locator('.studio')).toBeVisible();expect(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length)).toBe(1);await expect.poll(()=>app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0]!.getTitle())).toBe('Close guard fixture');await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',/changed locally/);
  expect(errors).toEqual([]);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-engagement-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
