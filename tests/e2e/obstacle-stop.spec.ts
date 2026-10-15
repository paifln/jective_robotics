import {parkVerificationWindow} from './helpers/window';
import {openSimulationTools} from './helpers/simulation';
import {prepareProgrammingWorkspace,startLessonProject} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L25 starter exposes missing data and reference stops through recovery in the actual worker',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-obstacle-ui-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);page.on('dialog',dialog=>dialog.accept());await expect(page.getByRole('button',{name:'Learn',exact:true})).toBeVisible();await expect(page.locator('#launch-screen')).toHaveCount(0);
  for(const reference of [false,true]){
   await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L25 ·/}).click();
   await expect(page.getByRole('heading',{name:'Obstacle stop',level:3,exact:true})).toBeVisible();
   if(!reference){
    const panel=page.locator('.obstacle-stop-panel');
    for(const scenario of ['near','far','boundary','missing','lost-then-restored','ray-obstacle']){
     await panel.getByLabel('Stop scenario',{exact:true}).selectOption(scenario);
     await panel.getByRole('button',{name:'Run stopping experiment',exact:true}).click();
     await expect(panel.getByRole('status')).toContainText('Simulation only');
     const path=join(root,scenario+'.json');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},path);
     await panel.getByRole('button',{name:'Export stopping experiment JSON',exact:true}).click();
     await expect.poll(async()=>{try{return JSON.parse(await readFile(path,'utf8')).scenario;}catch{return '';}}).toBe(scenario);
     const report=JSON.parse(await readFile(path,'utf8'));expect(report.physicalVerification).toBe('NOT RUN');expect(report.trace.at(-1).left).toBe(0);
     if(scenario==='ray-obstacle'){expect(report.stopping.bodyClearanceMeters).toBeGreaterThan(0);expect(report.trace.every((state:{collision:boolean})=>!state.collision)).toBe(true);}
     if(scenario==='missing')expect(report.stopping.reason).toBe('invalid-reading');
     if(scenario==='boundary')expect(report.displacementMeters).toBe(0);
    }
    await panel.getByLabel('Stop threshold (m)',{exact:true}).fill('');await expect(panel.getByRole('button',{name:'Export stopping experiment JSON',exact:true})).toHaveCount(0);
    await panel.getByRole('button',{name:'Run stopping experiment',exact:true}).click();await expect(panel.getByRole('alert')).toBeVisible();
   }
   await startLessonProject(page,reference?true:false);await expect(page.getByLabel('Project name')).toHaveValue('L25 · My experiment');
   await page.getByRole('button',{name:'Simulator',exact:true}).click();await expect(page.getByLabel('World',{exact:true})).toHaveValue('L25-missing-data');
   await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText(reference?'"status": "completed"':'"status": "error"',{timeout:10000});
   const state=JSON.parse((await page.locator('.simulator-workspace pre').textContent())!);
   const path=join(root,reference?'reference.json':'starter.json');
   await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},path);
   await openSimulationTools(page);await page.getByRole('button',{name:'Export scenario and state',exact:true}).click();
   await expect.poll(async()=>{try{return JSON.parse(await readFile(path,'utf8')).trace.at(-1).status;}catch{return '';}}).toBe(reference?'completed':'error');
   const exported=JSON.parse(await readFile(path,'utf8')),final=exported.trace.at(-1);expect(final.left).toBe(0);expect(final.right).toBe(0);
   if(reference){expect(state.variables.stopped).toBe(1);expect(state.distance).toBe(1);expect(state.timeMs).toBeGreaterThan(400);expect(state.pose.x).toBeCloseTo(1.524,10);}
   else{expect(state.error).toContain('DISTANCE_READING_INVALID');expect(state.timeMs).toBe(200);}
  }
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
