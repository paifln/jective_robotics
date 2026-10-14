import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L28 checks four learner predictions and real worker loss-stop behavior',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-line-following-')),env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',dialog=>dialog.accept());await expect(page.getByRole('button',{name:'Learn',exact:true})).toBeVisible();await expect(page.locator('#launch-screen')).toHaveCount(0);
  await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L28 ·/}).click();await expect(page.getByRole('heading',{name:'Two-sensor line following',level:3,exact:true})).toBeVisible();
  const panel=page.locator('.line-following-panel');
  await panel.getByLabel('Line prediction',{exact:true}).selectOption('lost');await panel.getByRole('button',{name:'Check and run',exact:true}).click();await expect(panel.getByRole('status')).toContainText('Review');
  for(const caseId of ['centered','left','right','lost']){
   await panel.getByLabel('Line fixture',{exact:true}).selectOption(caseId);await expect(panel.getByRole('button',{name:'Export decision evidence',exact:true})).toHaveCount(0);
   await panel.getByLabel('Line prediction',{exact:true}).selectOption(caseId);await panel.getByRole('button',{name:'Check and run',exact:true}).click();await expect(panel.getByRole('status')).toContainText('Correct prediction');
   const path=join(root,`${caseId}.json`);await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},path);await panel.getByRole('button',{name:'Export decision evidence',exact:true}).click();
   await expect.poll(async()=>{try{return JSON.parse(await readFile(path,'utf8')).caseId;}catch{return '';}}).toBe(caseId);
   const report=JSON.parse(await readFile(path,'utf8'));expect(report.origin).toBe('actual-robot-simulation');expect(report.predictionCorrect).toBe(true);expect(report.decisions[0].state).toBe(caseId);expect(report.decisions).toHaveLength(400);expect(report.trace.at(-1).status).toBe('completed');expect(report.trace.every((frame:{collision:boolean})=>!frame.collision)).toBe(true);expect(report.settledStopMs-report.stopRequestMs).toBeLessThanOrEqual(100);
  }
  await panel.screenshot({path:'test-results/line-following-en-desktop.png'});
  await page.setViewportSize({width:800,height:900});await page.getByLabel('Language',{exact:true}).selectOption('ru');
  await expect(panel.getByRole('heading',{name:'Лаборатория таблицы решений'})).toBeVisible();await panel.getByLabel('Случай линии',{exact:true}).selectOption('centered');await panel.getByLabel('Прогноз линии',{exact:true}).selectOption('centered');await panel.getByRole('button',{name:'Проверить и запустить',exact:true}).click();await expect(panel.getByRole('status')).toContainText('Верный прогноз');await panel.screenshot({path:'test-results/line-following-ru-800.png'});
  await page.getByLabel('Язык',{exact:true}).selectOption('kk');await expect(panel.getByRole('heading',{name:'Шешім кестесі зертханасы'})).toBeVisible();await panel.getByRole('button',{name:'Тексеру және іске қосу',exact:true}).click();await expect(panel.getByRole('status')).toContainText('Дұрыс болжам');await panel.screenshot({path:'test-results/line-following-kk-800.png'});
  await page.getByLabel('Тіл',{exact:true}).selectOption('en');await page.setViewportSize({width:1280,height:900});
  const endpoints=[];
  for(const reference of [false,true]){
   await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L28 ·/}).click();await page.getByRole('button',{name:reference?'Load reference solution':'Load starter',exact:true}).click();await page.getByRole('button',{name:'Simulation',exact:true}).click();await expect(page.getByLabel('World',{exact:true})).toHaveValue('L28-two-sensor-line');
   await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.feature pre')).toContainText('"status": "completed"',{timeout:20000});
   const path=join(root,reference?'reference.json':'starter.json');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},path);await page.getByRole('button',{name:'Export scenario and state',exact:true}).click();
   await expect.poll(async()=>{try{return JSON.parse(await readFile(path,'utf8')).trace.at(-1).status;}catch{return '';}}).toBe('completed');
   const report=JSON.parse(await readFile(path,'utf8')),trace=report.trace;expect(trace.every((frame:{collision:boolean})=>!frame.collision)).toBe(true);endpoints.push(trace.at(-1).pose.x);
   if(reference){const loss=trace.find((frame:{variables:{line_state:number}})=>frame.variables.line_state===3);expect(loss).toBeDefined();const settled=trace.find((frame:{timeMs:number;left:number;right:number})=>frame.timeMs>=loss.timeMs&&frame.left===0&&frame.right===0);expect(settled.timeMs-loss.timeMs).toBeLessThanOrEqual(100);expect(trace.filter((frame:{timeMs:number})=>frame.timeMs>=settled.timeMs).every((frame:{left:number;right:number})=>frame.left===0&&frame.right===0)).toBe(true);}
  }
  expect(endpoints[0]!-endpoints[1]!).toBeGreaterThan(.2);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
