import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L26 worker traces distinguish starter collision, reference recovery and stop during turn',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-avoidance-ui-')),env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',dialog=>dialog.accept());await expect(page.getByRole('button',{name:'Learn',exact:true})).toBeVisible();await expect(page.locator('#launch-screen')).toHaveCount(0);
  for(const mode of ['starter','reference','stop']){
   await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L26 ·/}).click();
   await expect(page.getByRole('heading',{name:'Obstacle avoidance states',level:3,exact:true})).toBeVisible();
   if(mode==='starter'){
    const panel=page.locator('.avoidance-panel');await panel.locator('summary').click();
    for(const scenario of ['recovery','blocked']){
     await panel.getByLabel('Avoidance world',{exact:true}).selectOption(scenario);await panel.getByRole('button',{name:'Run avoidance model',exact:true}).click();
     await panel.getByLabel('Avoidance replay time',{exact:true}).fill('150');
     await expect(panel.getByRole('status')).toContainText(scenario==='blocked'?'Blocked':'3000');
     await panel.getByRole('button',{name:'Play replay',exact:true}).click();
     await expect.poll(async()=>Number(await panel.getByLabel('Avoidance replay time',{exact:true}).inputValue())).toBeGreaterThan(150);
     await panel.getByRole('button',{name:'Pause replay',exact:true}).click();
     const paused=await panel.getByLabel('Avoidance replay time',{exact:true}).inputValue();await page.waitForTimeout(120);
     await expect(panel.getByLabel('Avoidance replay time',{exact:true})).toHaveValue(paused);
     await panel.getByLabel('Avoidance replay time',{exact:true}).fill('198');await panel.getByRole('button',{name:'Play replay',exact:true}).click();
     await expect(panel.getByLabel('Avoidance replay time',{exact:true})).toHaveValue('199');await expect(panel.getByRole('button',{name:'Play replay',exact:true})).toBeVisible();
     const path=join(root,'lab-'+scenario+'.json');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},path);
     await panel.getByRole('button',{name:'Export avoidance JSON',exact:true}).click();await expect.poll(async()=>{try{return JSON.parse(await readFile(path,'utf8')).scenario;}catch{return '';}}).toBe(scenario);
     const report=JSON.parse(await readFile(path,'utf8'));expect(report.origin).toBe('geometry-controller-model');expect(report.rows).toHaveLength(200);expect(report.rows.every((row:{collision:boolean})=>!row.collision)).toBe(true);
    }
   }
   await page.getByRole('button',{name:mode==='starter'?'Load starter':'Load reference solution',exact:true}).click();
   await page.getByRole('button',{name:'Simulation',exact:true}).click();await expect(page.getByLabel('World',{exact:true})).toHaveValue('L26-recovery');
   if(mode==='stop'){
    await page.getByText('Edit scenario JSON (start, goal, obstacles and line)',{exact:true}).click();await page.getByRole('button',{name:'Load current',exact:true}).click();
    const world=JSON.parse(await page.getByLabel('Scenario JSON',{exact:true}).inputValue());world.buttonEvents=[{timeMs:800,pressed:true},{timeMs:1000,pressed:false}];
    await page.getByLabel('Scenario JSON',{exact:true}).fill(JSON.stringify(world));await page.getByRole('button',{name:'Apply scenario',exact:true}).click();
   }
   await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.feature pre')).toContainText('"status": "completed"',{timeout:10000});
   const path=join(root,mode+'.json');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},path);
   await page.getByRole('button',{name:'Export scenario and state',exact:true}).click();await expect.poll(async()=>{try{return JSON.parse(await readFile(path,'utf8')).trace.at(-1).status;}catch{return '';}}).toBe('completed');
   const report=JSON.parse(await readFile(path,'utf8'));expect(report.trace.some((state:{collision:boolean})=>state.collision)).toBe(mode==='starter');
   if(mode!=='stop')for(const stateId of [0,1,2,3,4])expect(report.trace.some((state:{variables:{avoid_state:number}})=>state.variables.avoid_state===stateId)).toBe(true);
   if(mode==='stop'){
    expect(report.trace.find((state:{timeMs:number})=>state.timeMs===820).variables.avoid_state).toBe(6);
    expect(report.trace.filter((state:{timeMs:number})=>state.timeMs>=1100).every((state:{variables:{avoid_state:number};left:number;right:number})=>state.variables.avoid_state===6&&state.left===0&&state.right===0)).toBe(true);
   }
  }
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
