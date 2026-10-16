import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

test('untouched starter and code copies do not earn activity; edited successful saves do',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-activity-baseline-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow,dialog},root)=>{let index=0;dialog.showSaveDialog=async()=>({canceled:false,filePath:root+'/saved-'+(++index)+'.json'});BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.webContents.setBackgroundThrottling(false);w.setPosition(-12000,-12000);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();});},root);
  await expect(page.locator('#launch-screen')).toHaveCount(0,{timeout:20000});await page.locator('main>header>label>select').selectOption('en');await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();
  const save=page.getByRole('button',{name:'Save project',exact:true});const activity=async()=>{const r=await page.evaluate(()=>window.jective.activity());expect(r.ok).toBe(true);return r.ok?Object.values(r.value):[];};
  await save.click();await expect.poll(async()=>{try{return JSON.parse(await readFile(join(root,'saved-1.json'),'utf8')).mode;}catch{return '';}}).toBe('blocks');expect(await activity()).toEqual([]);
  await page.locator('.student-settings>summary').click();await page.getByRole('button',{name:'Convert to Code',exact:true}).click();await expect(page.locator('.studio .monaco-editor')).toBeVisible();await save.click();await expect.poll(async()=>{try{return JSON.parse(await readFile(join(root,'saved-2.json'),'utf8')).mode;}catch{return '';}}).toBe('code');expect(await activity()).toEqual([]);
  await page.locator('.studio .monaco-editor textarea').focus();await page.keyboard.press('Control+End');await page.keyboard.type('\n// learner edit');await save.click();await expect.poll(activity).toEqual([1]);await save.click();await expect(page.locator('.output')).toContainText('3');expect(await activity()).toEqual([1]);
  await page.getByRole('button',{name:'Work on a project copy',exact:true}).click();await save.click();await expect.poll(async()=>{try{return JSON.parse(await readFile(join(root,'saved-3.json'),'utf8')).mode;}catch{return '';}}).toBe('code');expect(await activity()).toEqual([1]);
  await page.getByRole('button',{name:'Work on a project copy',exact:true}).click();await app.evaluate(({dialog})=>{dialog.showSaveDialog=async()=>({canceled:true,filePath:''});});await page.locator('.studio .monaco-editor textarea').focus();await page.keyboard.press('Control+End');await page.keyboard.type('\n// another learner edit');await save.click();await expect(page.locator('.output')).toContainText('SAVE_CANCELLED');expect(await activity()).toEqual([1]);
  await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},join(root,'saved-4.json'));await save.click();await expect.poll(activity).toEqual([2]);expect(JSON.parse(await readFile(join(root,'saved-4.json'),'utf8')).source).toContain('// another learner edit');
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});

