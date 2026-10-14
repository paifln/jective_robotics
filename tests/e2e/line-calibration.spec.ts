import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L27 reference preserves both actual probe samples in exported worker traces',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-line-calibration-')),env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',dialog=>dialog.accept());await expect(page.getByRole('button',{name:'Learn',exact:true})).toBeVisible();await expect(page.locator('#launch-screen')).toHaveCount(0);
  for(const reference of [false,true]){
   await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L27 ·/}).click();await expect(page.getByRole('heading',{name:'Line sensor calibration',level:3,exact:true})).toBeVisible();
   if(!reference){
    const panel=page.locator('.line-calibration-panel');await panel.getByRole('button',{name:'Check calibration choice',exact:true}).click();await expect(panel.getByRole('alert')).toBeVisible();
    await panel.getByLabel('Threshold explanation',{exact:true}).fill('The selected value lies strictly between recorded dark and light limits.');await panel.getByLabel('Line threshold',{exact:true}).fill('0.4');
    await panel.getByRole('button',{name:'Check calibration choice',exact:true}).click();await expect(panel.getByRole('status')).toContainText('separates');
    const path=join(root,'calibration.json');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},path);await panel.getByRole('button',{name:'Export calibration JSON',exact:true}).click();
    await expect.poll(async()=>{try{return JSON.parse(await readFile(path,'utf8')).report.selectedThreshold;}catch{return -1;}}).toBe(.4);
    const report=JSON.parse(await readFile(path,'utf8'));expect(report.example.origin).toBe('simulation');expect(report.report.calibration.dark).toEqual([0,0,0]);expect(report.report.physicalVerification).toBe('NOT RUN');
    await panel.getByLabel('Dark samples',{exact:true}).fill('0,1\n0.15\n0.2');await panel.getByLabel('Light samples',{exact:true}).fill('0.8\n0.85\n0.9');
    await expect(panel.getByRole('button',{name:'Export calibration JSON',exact:true})).toHaveCount(0);
    await panel.getByRole('button',{name:'Check calibration choice',exact:true}).click();await expect(panel.getByRole('status')).toContainText('separates');
    for(const [value,label] of [['0.1','Dark'],['0.9','Light'],['0.5','Uncertain'],['','Uncertain'],['bad','Uncertain']] as const){await panel.getByLabel('Inspect reflectance',{exact:true}).fill(value);await expect(panel.getByTestId('reflectance-classification')).toHaveText(label);}
    const customPath=join(root,'custom-calibration.json');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},customPath);await panel.getByRole('button',{name:'Export calibration JSON',exact:true}).click();
    await expect.poll(async()=>{try{return JSON.parse(await readFile(customPath,'utf8')).inputOrigin;}catch{return '';}}).toBe('learner-entered');
    const custom=JSON.parse(await readFile(customPath,'utf8'));expect(custom.report.calibration.dark).toEqual([.1,.15,.2]);expect(custom.inspection).toEqual({rawInput:'bad',value:null,classification:'uncertain'});
    await panel.getByLabel('Light samples',{exact:true}).fill('0.1\n0.15\n0.2');await panel.getByRole('button',{name:'Check calibration choice',exact:true}).click();await expect(panel.getByRole('alert')).toBeVisible();await expect(panel.getByRole('button',{name:'Export calibration JSON',exact:true})).toHaveCount(0);
    await panel.getByLabel('Line threshold',{exact:true}).fill('');await expect(panel.getByRole('button',{name:'Export calibration JSON',exact:true})).toHaveCount(0);
    await panel.getByRole('button',{name:'Check calibration choice',exact:true}).click();await expect(panel.getByRole('alert')).toBeVisible();
   }
   await page.getByRole('button',{name:reference?'Load reference solution':'Load starter',exact:true}).click();await page.getByRole('button',{name:'Simulation',exact:true}).click();await expect(page.getByLabel('World',{exact:true})).toHaveValue('L27-cross-line');
   await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.feature pre')).toContainText('"status": "completed"');
   const path=join(root,reference?'reference.json':'starter.json');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},path);
   await page.getByRole('button',{name:'Export scenario and state',exact:true}).click();await expect.poll(async()=>{try{return JSON.parse(await readFile(path,'utf8')).trace.at(-1).status;}catch{return '';}}).toBe('completed');
   const report=JSON.parse(await readFile(path,'utf8')),trace=report.trace;
   expect(trace.every((state:{collision:boolean})=>!state.collision)).toBe(true);
   for(const value of [0,1])expect(trace.some((state:{variables:{left_reflectance:number}})=>state.variables.left_reflectance===value)).toBe(true);
   if(reference){for(const value of [0,1])expect(trace.some((state:{variables:{right_reflectance:number}})=>state.variables.right_reflectance===value)).toBe(true);expect(trace.at(-1).log.filter((line:string)=>line.includes('right='))).toHaveLength(50);}
   else expect(trace.at(-1).variables.right_reflectance).toBeUndefined();
  }
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
