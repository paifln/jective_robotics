import { _electron as electron } from 'playwright';
import {mkdtemp,rm,mkdir,writeFile,readFile} from 'node:fs/promises';
import {tmpdir,cpus,totalmem,platform,release} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';

const runs=[];
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
for(let i=0;i<5;i++){
 const root=await mkdtemp(join(tmpdir(),'jective-startup-measure-'));
 let app;
 try{
  const start=performance.now();
  app=await electron.launch({args:['.'],env:{...env,JECTIVE_WORKSPACE_ROOT:root},timeout:30000});
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.setPosition(-12000,-12000);w.webContents.setBackgroundThrottling(false);w.showInactive();}));
  const page=await app.firstWindow();
  await page.locator('#launch-screen').waitFor({state:'detached',timeout:30000});
  await page.locator('main>nav[aria-label="Workspace sections"]').waitFor({state:'visible'});
  const workspace=await page.evaluate(()=>window.jective.workspace());
  if(!workspace.ok)throw new Error('WORKSPACE_NOT_READY');
  const launchMs=performance.now()-start;
  const memory=await app.evaluate(({app})=>app.getAppMetrics().map(p=>({type:p.type,workingSetKiB:p.memory.workingSetSize})));
  runs.push({run:i+1,launchMs,workingSetMiB:memory.reduce((n,p)=>n+p.workingSetKiB,0)/1024,processMemory:memory});
  console.log(JSON.stringify(runs.at(-1)));
 }finally{
  if(app){await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise(r=>app.process().once('exit',r));}
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-startup-measure-'))throw new Error('UNSAFE_CLEANUP');
  await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
}
const median=[...runs].sort((a,b)=>a.launchMs-b.launchMs)[2].launchMs;
const report={scope:'source Electron fresh-process/fresh-workspace launch; OS cache not cleared; Playwright overhead included',host:{platform:platform(),release:release(),cpu:cpus()[0].model,logicalCores:cpus().length,memoryGiB:totalmem()/1024**3},rendererSha256:createHash('sha256').update(await readFile('dist/renderer/app.js')).digest('hex'),runs,medianLaunchMs:median,comparisonWith8sTarget:median<=8000?'WITHIN TARGET ON THIS HOST':'MISSED ON THIS HOST',requiredBaselineAcceptance:'NOT VERIFIED',idle30MinuteMemory:'NOT RUN',block500EditP95:'NOT RUN',worldFPS:'NOT RUN'};
await mkdir('evidence/startup-measure',{recursive:true});
await writeFile('evidence/startup-measure/source-launch.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({medianLaunchMs:median,requiredBaselineAcceptance:report.requiredBaselineAcceptance}));
