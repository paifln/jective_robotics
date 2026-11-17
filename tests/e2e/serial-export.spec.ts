import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('serial monitor exports an actual file describing origin and receipt clock even when no hardware was opened',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-serial-export-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.webContents.setBackgroundThrottling(false);w.setPosition(-12000,-12000);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('main>header>label>select').selectOption('en');await page.locator('main>nav').getByRole('button',{name:'Serial Monitor',exact:true}).click();await expect(page.locator('.board-monitor')).toContainText('Monitor closed');
  const destination=join(root,'serial.txt');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},destination);
  await page.locator('.board-monitor').getByRole('button',{name:'Save messages',exact:true}).click();await expect.poll(async()=>{try{return (await readFile(destination,'utf8')).includes('Origin: SERIAL MONITOR');}catch{return false;}}).toBe(true);
  const log=await readFile(destination,'utf8');expect(log).toContain('desktop receipt/status timestamp');expect(log).toContain('not independently prove physical movement');expect(log).toContain('current selection is not substituted');
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
