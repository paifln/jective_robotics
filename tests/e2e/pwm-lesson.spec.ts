import {parkVerificationWindow} from './helpers/window';
import {openSimulationTools,runIndicatorExperiment} from './helpers/simulation';
import {prepareProgrammingWorkspace,startLessonProject} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L15 actual starter fails at 115 percent and reference generates LEDC and completes at zero',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-pwm-lesson-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);page.on('dialog',d=>d.accept());await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  for(const repaired of [false,true]){
   await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L15 ·/}).click();await startLessonProject(page,repaired?true:false);await expect(page.getByLabel('Project name')).toHaveValue('L15 · My experiment');await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',new RegExp('ledcAttach'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));await runIndicatorExperiment(page);
   if(repaired){await expect(page.locator('.output')).toContainText('800 ms | pwm channel 1: 100 %');await expect(page.locator('.output')).toContainText('1000 ms | pwm channel 1: 0 %');await expect(page.locator('.output')).toContainText('DONE');}else await expect(page.locator('.output')).toContainText('PWM_RANGE');
   await page.getByRole('button',{name:'Simulator',exact:true}).click();await openSimulationTools(page);await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText(repaired?'"status": "completed"':'PWM_RANGE');await expect(page.locator('.simulator-workspace pre')).toContainText(repaired?'"ledDuty": 0':'"ledDuty": 90');
  }
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
