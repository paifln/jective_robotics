import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L05 message evidence exports real timestamps and simulation origin',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-messages-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',dialog=>dialog.accept());
  await expect(page.locator('.monaco-editor').first()).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await page.getByRole('button',{name:'Learn',exact:true}).click();
  await page.getByRole('button',{name:/^L05 ·/}).click();
  await page.getByRole('button',{name:'Load reference solution',exact:true}).click();
  await expect(page.getByLabel('Project name')).toHaveValue('L05 learner project');
  await page.getByRole('button',{name:'Simulate indicator trace',exact:true}).click();
  await expect(page.locator('.output')).toContainText('1250 ms | print: PHASE_B');
  const destination=join(root,'messages.json');
  await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},destination);
  await page.getByRole('button',{name:'Export simulation trace',exact:true}).click();
  await expect.poll(async()=>{try{return JSON.parse(await readFile(destination,'utf8')).origin;}catch{return null;}}).toBe('simulation');
  const payload=JSON.parse(await readFile(destination,'utf8'));
  expect(payload.trace.slice(0,5).map((e:{timeMs:number;value:string})=>[e.timeMs,e.value])).toEqual([[0,'SIMULATION START'],[0,'PHASE_A'],[250,'PHASE_B'],[1000,'PHASE_A'],[1250,'PHASE_B']]);
 }finally{await app.evaluate(({app})=>app.exit(0));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
