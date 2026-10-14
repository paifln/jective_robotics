import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';

test('assistant settings recover from rejected IPC without revealing credentials, then save through the real service',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-assistant-setup-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 let app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await page.waitForLoadState();
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.webContents.setBackgroundThrottling(false);w.setPosition(-12000,-12000);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));
  await page.locator('main>header>label>select').selectOption('en');
  // Deliberately invalid response exercises the real preload validation rejection.
  // No provider request and no real API key are used in this test.
  await app.evaluate(({ipcMain})=>{
   ipcMain.removeHandler('assistant:configure');
   ipcMain.handle('assistant:configure',()=>({ok:true,value:'TEST_ONLY_DUMMY_SECRET'}));
  });
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.getByRole('button',{name:'Help',exact:true}).click();
  const panel=page.locator('.assistant-setup');await panel.locator('summary').click();
  await panel.getByLabel('OpenAI model',{exact:true}).fill('explicit-test-fixture');
  await panel.getByLabel('API key',{exact:true}).fill('TEST_ONLY_DUMMY_SECRET');
  await panel.getByRole('button',{name:'Save settings',exact:true}).click();
  await expect(panel.getByRole('status')).toContainText('Could not save assistant settings');
  await expect(panel.getByRole('status')).not.toContainText('TEST_ONLY_DUMMY_SECRET');
  await expect(panel.getByLabel('API key',{exact:true})).toHaveValue('TEST_ONLY_DUMMY_SECRET');
  await expect(panel.getByRole('button',{name:'Save settings',exact:true})).toBeEnabled();expect(errors).toEqual([]);
  // Restart to restore untouched production handlers, then actually save locally.
  await app.evaluate(({app})=>app.exit(0)).catch(()=>{});
  if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));
  app=await electron.launch({args:['.'],env});const fresh=await app.firstWindow();
  await fresh.getByRole('button',{name:'Help',exact:true}).click();const actual=fresh.locator('.assistant-setup');await actual.locator('summary').click();
  await actual.getByLabel('OpenAI model',{exact:true}).fill('explicit-test-fixture');await actual.getByLabel('API key',{exact:true}).fill('TEST_ONLY_DUMMY_SECRET');
  await actual.getByRole('button',{name:'Save settings',exact:true}).click();await expect(actual.getByRole('status')).toHaveText('Settings saved');
  await expect(actual.getByLabel('API key',{exact:true})).toHaveValue('');
  const saved=await readFile(join(root,'assistant.json'),'utf8');expect(saved).not.toContain('TEST_ONLY_DUMMY_SECRET');
  expect(await fresh.evaluate(()=>window.jective.assistantSettings())).toMatchObject({ok:true,value:{enabled:true,keyConfigured:true,model:'explicit-test-fixture'}});
 }finally{
  if(app.process().exitCode===null&&app.process().signalCode===null)await app.evaluate(({app})=>app.exit(0)).catch(()=>{});
  if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-assistant-setup-'))throw new Error('UNSAFE_CLEANUP');
  await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
