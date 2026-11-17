import {parkVerificationWindow} from './helpers/window';
import {openSimulationTools,runIndicatorExperiment} from './helpers/simulation';
import {prepareProgrammingWorkspace,startLessonProject} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L16 actual projects repair delayed feedback and export a cancelled sound pattern',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-sound-lesson-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);page.on('dialog',d=>d.accept());await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  for(const repaired of [false,true]){
   await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L16 ·/}).click();await startLessonProject(page,repaired?true:false);await expect(page.getByLabel('Project name')).toHaveValue('L16 · My experiment');await runIndicatorExperiment(page);await expect(page.locator('.output')).toContainText('0 s | sound: 440 Hz for 0.12 s');await expect(page.locator('.output')).toContainText(repaired?'0 s | print: READY':'0.12 s | print: READY');await expect(page.locator('.output')).toContainText(repaired?'0.6 s | print: FINISHED':'0.96 s | print: FINISHED');
  }
  await page.getByRole('button',{name:'Simulator',exact:true}).click();await openSimulationTools(page);await page.getByRole('button',{name:'Step 0.02 s',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText('"status": "ready"');await page.getByRole('button',{name:'Step 0.02 s',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText('"frequencyHz": 440');await page.getByRole('button',{name:'Cancel simulation',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText('"status": "cancelled"');await expect(page.locator('.simulator-workspace pre')).toContainText('"sound": null');
  const path=join(root,'cancelled.json');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},path);await page.getByRole('button',{name:'Export scenario and state',exact:true}).click();await expect.poll(async()=>{try{return JSON.parse(await readFile(path,'utf8')).trace.at(-1).status;}catch{return '';}}).toBe('cancelled');const exported=JSON.parse(await readFile(path,'utf8'));expect(exported.origin).toBe('simulation');expect(exported.trace.at(-1).timeMs).toBe(20);expect(exported.trace.at(-1).sound).toBeNull();expect(exported.trace.at(-1).log).toEqual(['0 s: READY','0.02 s: CANCELLED']);expect(exported.program.setup[0].kind).toBe('sound');await copyFile(path,'test-results/L16-cancelled.json');
  await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText('"status": "completed"');await expect(page.locator('.simulator-workspace')).toContainText('0.6 s: FINISHED');await expect(page.locator('.simulator-workspace pre')).toContainText('"sound": null');
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
