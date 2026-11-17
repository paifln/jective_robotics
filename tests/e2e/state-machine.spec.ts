import {parkVerificationWindow} from './helpers/window';
import {openSimulationTools} from './helpers/simulation';
import {prepareProgrammingWorkspace,startLessonProject} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L12 displays its diagram and automatically supplies the same scenario to failing and repaired programs',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-state-machine-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);page.on('dialog',d=>d.accept());await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  for(const repaired of [false,true]){
   await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L12 ·/}).click();await expect(page.getByRole('img',{name:'State diagram: each press advances IDLE to ACTIVE to DONE to IDLE'})).toBeVisible();if(!repaired)await page.locator('figure').filter({has:page.getByRole('img',{name:'State diagram: each press advances IDLE to ACTIVE to DONE to IDLE',exact:true})}).screenshot({path:'test-results/L12-state-diagram.png'});await startLessonProject(page,repaired?true:false);await expect(page.getByLabel('Project name')).toHaveValue('L12 · My experiment');
   await page.getByRole('button',{name:'Simulator',exact:true}).click();await openSimulationTools(page);await expect(page.getByLabel('World',{exact:true})).toHaveValue('L12-four-press-regression');await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.simulator-workspace')).toContainText(repaired?'0.4 s: STATE_ACTIVE':'0.4 s: MISSING_RETURN');await page.getByRole('button',{name:'Pause',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText('"state": '+(repaired?1:2));
  }
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
