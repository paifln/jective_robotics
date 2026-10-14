import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L13 runs its actual ten-trial scenario and exports raw/filtered simulation evidence',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-debounce-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',d=>d.accept());await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L13 ·/}).click();await page.getByRole('button',{name:'Load reference solution',exact:true}).click();await expect(page.getByLabel('Project name')).toHaveValue('L13 learner project');await page.getByRole('button',{name:'Simulation',exact:true}).click();await expect(page.getByLabel('World',{exact:true})).toHaveValue('L13-ten-bouncing-presses');await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.feature pre')).toContainText('"debounced_actions": 10');await expect(page.locator('.feature pre')).toContainText('"raw_actions": 40');await page.getByRole('button',{name:'Pause',exact:true}).click();
  const path=join(root,'debounce-evidence.json');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},path);await page.getByRole('button',{name:'Export scenario and state',exact:true}).click();await expect.poll(async()=>{try{return JSON.parse(await readFile(path,'utf8')).origin;}catch{return null;}}).toBe('simulation');const saved=JSON.parse(await readFile(path,'utf8'));expect(saved.world.buttonEvents).toHaveLength(80);expect(saved.trace.at(-1).variables.raw_actions).toBe(40);expect(saved.trace.at(-1).variables.debounced_actions).toBe(10);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
