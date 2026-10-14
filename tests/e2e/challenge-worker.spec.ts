import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {ChallengeReportSchema} from '../../packages/content/challenge-report';
test('actual challenge worker evaluates identical criteria and rejects oversized deadlines',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-challenge-worker-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.webContents.setBackgroundThrottling(false);w.setPosition(-12000,-12000);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));await expect(page.locator('#launch-screen')).toHaveCount(0);
  const result=await page.evaluate(async()=>{
   const execute=(timeoutMs:number)=>new Promise<{ok:boolean;reports?:{moving:unknown;stationary:unknown};error?:string}>((resolve,reject)=>{
    const operationId=crypto.randomUUID(),worker=new Worker(new URL('./challenge.worker.js',location.href),{type:'module'}),timer=setTimeout(()=>{worker.terminate();reject(new Error('worker timeout'));},10000);
    worker.onerror=e=>{clearTimeout(timer);worker.terminate();reject(new Error(e.message));};worker.onmessage=e=>{clearTimeout(timer);worker.terminate();if(e.data.operationId!==operationId)reject(new Error('Wrong operation identity'));else resolve(e.data);};worker.postMessage({operationId,inputs:{timeoutMs,requireGoal:true,forbidCollisions:true}});
   });
   const valid=await execute(6000),invalid=await execute(100000);let lateMessages=0;const cancelled=new Worker(new URL('./challenge.worker.js',location.href),{type:'module'});cancelled.onmessage=()=>lateMessages++;cancelled.postMessage({operationId:crypto.randomUUID(),inputs:{timeoutMs:6000,requireGoal:true,forbidCollisions:true}});cancelled.terminate();await new Promise<void>(r=>setTimeout(r,200));return {valid,invalid,lateMessages};
  });
  expect(result.valid.ok).toBe(true);const moving=ChallengeReportSchema.parse(result.valid.reports!.moving),stationary=ChallengeReportSchema.parse(result.valid.reports!.stationary);expect(moving.passed).toBe(true);expect(stationary.reason).toBe('timeout');expect(stationary.passed).toBe(false);expect(moving.criteria).toEqual(stationary.criteria);expect(stationary.trace).toHaveLength(301);expect(result.invalid.ok).toBe(false);expect(result.invalid.error!.length).toBeLessThanOrEqual(2000);expect(result.lateMessages).toBe(0);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-challenge-worker-'))throw new Error('Unexpected cleanup path');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
