import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {CollisionReportSchema} from '../../packages/content/collision-report';
test('real collision worker returns complete scenario evidence, rejects expanded requests and terminates',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-collision-worker-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.webContents.setBackgroundThrottling(false);w.setPosition(-12000,-12000);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));await expect(page.locator('#launch-screen')).toHaveCount(0);
  const results=await page.evaluate(async()=>{
   const execute=(extra:Record<string,unknown>)=>new Promise<{ok:boolean;report?:unknown;error?:string}>((resolve,reject)=>{
    const operationId=crypto.randomUUID(),worker=new Worker(new URL('./collision.worker.js',location.href),{type:'module'});
    const timer=setTimeout(()=>{worker.terminate();reject(new Error('worker timeout'));},10000);
    worker.onerror=e=>{clearTimeout(timer);worker.terminate();reject(new Error(e.message));};
    worker.onmessage=e=>{clearTimeout(timer);worker.terminate();if(e.data.operationId!==operationId)reject(new Error('Wrong operation identity'));else resolve(e.data);};
    worker.postMessage({operationId,...extra});
   });
   const valid=await execute({}),invalid=await execute({steps:100000});
   let lateMessages=0;const cancelled=new Worker(new URL('./collision.worker.js',location.href),{type:'module'});cancelled.onmessage=()=>lateMessages++;cancelled.postMessage({operationId:crypto.randomUUID()});cancelled.terminate();await new Promise<void>(r=>setTimeout(r,200));return {valid,invalid,lateMessages};
  });
  expect(results.valid.ok).toBe(true);const report=CollisionReportSchema.parse(results.valid.report);
  for(const name of ['wall','narrow'] as const){expect(report.cases[name].starter.collisionSeen).toBe(true);expect(report.cases[name].corrected.collisionSeen).toBe(false);}
  expect(report.cases.range.corrected.invalidDistanceSeen).toBe(true);expect(report.cases.range.corrected.final.pose).toEqual(report.cases.range.world.start);expect(report.invalidStart.rejected).toBe(true);
  expect(results.invalid.ok).toBe(false);expect(results.invalid.error!.length).toBeLessThanOrEqual(2000);expect(results.lateMessages).toBe(0);
 }finally{
  await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-collision-worker-'))throw new Error('Unexpected cleanup path');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
