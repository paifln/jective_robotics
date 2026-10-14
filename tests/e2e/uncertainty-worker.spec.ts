import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {UncertaintyReportSchema} from '../../packages/content/uncertainty-report';
test('real uncertainty worker produces stationary noisy and zero-noise traces with bounded requests',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-uncertainty-worker-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.webContents.setBackgroundThrottling(false);w.setPosition(-12000,-12000);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));await expect(page.locator('#launch-screen')).toHaveCount(0);
  const result=await page.evaluate(async()=>{
   const execute=(inputs:unknown)=>new Promise<{ok:boolean;report?:unknown;error?:string}>((resolve,reject)=>{
    const operationId=crypto.randomUUID(),worker=new Worker(new URL('./uncertainty.worker.js',location.href),{type:'module'}),timer=setTimeout(()=>{worker.terminate();reject(new Error('worker timeout'));},10000);
    worker.onerror=e=>{clearTimeout(timer);worker.terminate();reject(new Error(e.message));};worker.onmessage=e=>{clearTimeout(timer);worker.terminate();if(e.data.operationId!==operationId)reject(new Error('Wrong operation identity'));else resolve(e.data);};worker.postMessage({operationId,inputs});
   });
   const noisy=await execute({seed:23,samples:100,noiseMeters:.05}),repeat=await execute({seed:23,samples:100,noiseMeters:.05}),zero=await execute({seed:23,samples:100,noiseMeters:0}),invalid=await execute({seed:23,samples:100000,noiseMeters:.05});
   let lateMessages=0;const cancelled=new Worker(new URL('./uncertainty.worker.js',location.href),{type:'module'});cancelled.onmessage=()=>lateMessages++;cancelled.postMessage({operationId:crypto.randomUUID(),inputs:{seed:23,samples:300,noiseMeters:.05}});cancelled.terminate();await new Promise<void>(r=>setTimeout(r,200));return {noisy,repeat,zero,invalid,lateMessages};
  });
  expect(result.noisy.ok).toBe(true);expect(result.repeat.ok).toBe(true);expect(result.repeat.report).toEqual(result.noisy.report);const noisy=UncertaintyReportSchema.parse(result.noisy.report),zero=UncertaintyReportSchema.parse(result.zero.report);expect(noisy.summary.span).toBeGreaterThan(0);expect(noisy.trace).toHaveLength(100);expect(noisy.trace.at(-1)!.timeMs).toBe(2000);expect(zero.summary.span).toBe(0);expect(zero.summary.mean).toBe(1.5);expect(result.invalid.ok).toBe(false);expect(result.invalid.error!.length).toBeLessThanOrEqual(2000);expect(result.lateMessages).toBe(0);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-uncertainty-worker-'))throw new Error('Unexpected cleanup path');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});

