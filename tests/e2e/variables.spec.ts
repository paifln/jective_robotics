import {parkVerificationWindow} from './helpers/window';
import {openSimulationTools} from './helpers/simulation';
import {prepareProgrammingWorkspace,startLessonProject} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L07 loads actual parameter blocks and runs its sensor reference in the robot worker',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-variables-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);page.on('dialog',d=>d.accept());
  await expect(page.locator('.monaco-editor').first()).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await page.getByRole('button',{name:'Learn',exact:true}).click();
  await page.getByRole('button',{name:/^L07 ·/}).click();
  await expect(page.locator('.content article')).toContainText('interval_ms');
  await startLessonProject(page,true);
  await expect(page.getByLabel('Project name')).toHaveValue('L07 · My experiment');
  await expect(page.locator('.output')).toContainText('SENSOR_DRIVER_REQUIRED');
  await page.getByRole('button',{name:'Simulator',exact:true}).click();await openSimulationTools(page);
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(page.locator('.simulator-workspace pre')).toContainText('"timeMs": 0');
  for(let step=1;step<=13;step++){
   await page.getByRole('button',{name:'Step 20 ms',exact:true}).click();
   await expect(page.locator('.simulator-workspace pre')).toContainText(`"timeMs": ${step*20}`);
  }
  await expect(page.locator('.simulator-workspace')).toContainText('240 ms: CLEAR');
 }finally{await app.evaluate(({app})=>app.exit(0));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
