import {parkVerificationWindow} from './helpers/window';
import {openSimulationTools} from './helpers/simulation';
import {prepareProgrammingWorkspace,startLessonProject} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L17 exposes actual model calibration CSV and handles starter fault/reference recovery',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-distance-lesson-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);page.on('dialog',d=>d.accept());await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L17 ·/}).click();await page.getByRole('button',{name:'Run distance calibration',exact:true}).click();const panel=page.locator('.distance-calibration');await expect(panel.locator('tbody tr')).toHaveCount(7);await expect(panel.locator('tbody tr').nth(5)).toContainText('outOfRange');await expect(panel.locator('tbody tr').nth(5)).toContainText('0 / 3');await expect(panel.locator('tbody tr').nth(6)).toContainText('missing');await panel.screenshot({path:'test-results/L17-calibration.png'});
  const csvPath=join(root,'calibration.csv');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},csvPath);await page.getByRole('button',{name:'Export calibration CSV',exact:true}).click();await expect.poll(async()=>{try{return (await readFile(csvPath,'utf8')).split('\r\n').length;}catch{return 0;}}).toBe(22);const csv=await readFile(csvPath,'utf8');expect(csv).toContain('"simulation","2.1","1","","outOfRange","ray","","0","1","2"');expect(csv).toContain('"simulation","","1","","missing","injected",""');await copyFile(csvPath,'test-results/L17-calibration.csv');
  for(const repaired of [false,true]){
   if(repaired){await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L17 ·/}).click();}
   await startLessonProject(page,repaired?true:false);await expect(page.getByLabel('Project name')).toHaveValue('L17 · My experiment');await page.getByRole('button',{name:'Simulator',exact:true}).click();await openSimulationTools(page);await expect(page.getByLabel('World',{exact:true})).toHaveValue('L17-distance-fault-recovery');await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText(repaired?'"status": "completed"':'DISTANCE_READING_INVALID');
   if(repaired){await expect(page.locator('.simulator-workspace pre')).toContainText('"valid_count": 4');await expect(page.locator('.simulator-workspace pre')).toContainText('"invalid_count": 2');await expect(page.locator('.simulator-workspace pre')).toContainText('"last_valid_m": 0.2');await expect(page.locator('.simulator-workspace')).toContainText('0.8 s: INVALID');}
  }
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
