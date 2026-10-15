import {parkVerificationWindow} from './helpers/window';
import {runIndicatorExperiment} from './helpers/simulation';
import {prepareProgrammingWorkspace,startLessonProject} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L10 actual reference blocks finish bounded work and continue the event-loop trace',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-loops-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);page.on('dialog',d=>d.accept());await expect(page.locator('.monaco-editor').first()).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L10 ·/}).click();await startLessonProject(page,true);await expect(page.getByLabel('Project name')).toHaveValue('L10 · My experiment');
  await runIndicatorExperiment(page);await expect(page.locator('.output')).toContainText('600 ms | print: DONE');await expect(page.locator('.output')).toContainText('700 ms | print: IDLE');
 }finally{await app.evaluate(({app})=>app.exit(0));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
