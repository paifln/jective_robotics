import {importPracticeArea,readPracticeArea} from './helpers/simulation';
import {parkVerificationWindow} from './helpers/window';
import {openSimulationTools} from './helpers/simulation';
import {prepareProgrammingWorkspace} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('scenario editor rejects out-of-world goals and exports the accepted custom scenario with simulation origin',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-world-validation-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,false);await expect(page.locator('.monaco-editor').first()).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await page.getByRole('button',{name:'Simulator',exact:true}).click();await openSimulationTools(page);
  await expect(page.getByLabel('Scenario JSON',{exact:true})).toHaveCount(0);await expect(page.getByLabel('Scenario JSON',{exact:true})).toHaveCount(0);
  const scenario=await readPracticeArea(app,page,join(root,'active-practice-area.json'));
  await importPracticeArea(page,{...scenario,goal:{...scenario.goal,x:4.1}});await expect(page.getByLabel('Scenario JSON',{exact:true})).toHaveCount(0);
  await expect(page.locator('.world-files').getByRole('alert')).toContainText('Your current area is unchanged');await expect(page.getByLabel('World',{exact:true})).toHaveValue('open-test-area');
  await importPracticeArea(page,{...scenario,analog:{referenceVolts:3.3,bits:12,inputVolts:5}});await expect(page.getByLabel('Scenario JSON',{exact:true})).toHaveCount(0);await expect(page.locator('.world-files').getByRole('alert')).toContainText('Your current area is unchanged');await expect(page.getByLabel('World',{exact:true})).toHaveValue('open-test-area');
  const accepted={...scenario,analog:{referenceVolts:3.3,bits:12,inputVolts:1.65,noiseVolts:.1,seed:42,events:[]},id:'teacher-custom-area',start:{...scenario.start,x:.6},buttonEvents:[{timeMs:20,pressed:true},{timeMs:80,pressed:false}]};await importPracticeArea(page,accepted);await expect(page.getByLabel('Scenario JSON',{exact:true})).toHaveCount(0);
  await expect(page.getByLabel('World',{exact:true})).toHaveValue('teacher-custom-area');await expect(page.locator('.simulator-workspace')).toContainText('This scenario changes the button during the run. The checkbox sets its starting value.');await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText('ready');
  await page.getByRole('checkbox',{name:'Simulated button pressed',exact:true}).check();
  await expect(page.locator('.simulator-workspace pre')).not.toContainText('ready');
  await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText('ready');
  const destination=join(root,'scenario.json');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},destination);
  await page.getByRole('button',{name:'Export scenario and state',exact:true}).click();await expect.poll(async()=>{try{return JSON.parse(await readFile(destination,'utf8')).origin;}catch{return null;}}).toBe('simulation');
  const exported=JSON.parse(await readFile(destination,'utf8'));expect(exported.world.id).toBe('teacher-custom-area');expect(exported.trace[0].pose.x).toBe(.6);expect(exported.world.inputs).toEqual({button:true});expect(exported.world.buttonEvents).toEqual(accepted.buttonEvents);expect(exported.world.analog).toEqual(accepted.analog);
 }finally{await app.evaluate(({app})=>app.exit(0));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
