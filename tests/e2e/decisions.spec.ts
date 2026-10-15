import {importPracticeArea,readPracticeArea} from './helpers/simulation';
import {parkVerificationWindow} from './helpers/window';
import {openSimulationTools} from './helpers/simulation';
import {prepareProgrammingWorkspace,startLessonProject} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L09 reference loads Boolean blocks and changes its lamp decision for real worker input changes',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-decisions-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);page.on('dialog',d=>d.accept());await expect(page.locator('.monaco-editor').first()).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L09 ·/}).click();await expect(page.locator('.content .library-layout>article')).toContainText('eight');
  await startLessonProject(page,true);await expect(page.getByLabel('Project name',{exact:true})).toHaveValue('L09 · My experiment');
  await page.getByRole('button',{name:'Simulator',exact:true}).click();await openSimulationTools(page);
  const trial=async(label:string)=>{await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText('"timeMs": 0');await page.getByRole('button',{name:'Step 20 ms',exact:true}).click();await expect(page.locator('.simulator-workspace')).toContainText('0 ms: '+label);};
  await trial('NOTICE_OFF');await page.getByRole('checkbox',{name:'Simulated button pressed',exact:true}).check();await trial('NOTICE_ON');
  await expect(page.getByLabel('Scenario JSON',{exact:true})).toHaveCount(0);await expect(page.getByLabel('Scenario JSON',{exact:true})).toHaveCount(0);
  const scene=await readPracticeArea(app,page,join(root,'active-practice-area.json'));scene.obstacles=[{x:1,y:1,width:.2,height:1}];
  await importPracticeArea(page,scene);await expect(page.getByLabel('Scenario JSON',{exact:true})).toHaveCount(0);await trial('NOTICE_OFF');
  await expect(page.locator('.simulator-workspace pre')).toContainText('"near": 1');
 }finally{await app.evaluate(({app})=>app.exit(0));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
