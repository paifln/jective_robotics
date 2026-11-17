import {parkVerificationWindow} from './helpers/window';
import {openSimulationTools,runIndicatorExperiment} from './helpers/simulation';
import {prepareProgrammingWorkspace} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {programWorkspace} from '../../apps/desktop/renderer/blocks';
import type {Program} from '../../packages/codegen';
test('actual PWM blocks execute through indicator and robot workers with explicit percentage units',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-pwm-simulation-')),path=join(root,'pwm.jective.json');const program:Program={setup:[{kind:'pwm',value:{kind:'number',value:25}},{kind:'wait',ms:20},{kind:'pwm',channel:2,value:{kind:'number',value:75}}],loop:[]};await writeFile(path,JSON.stringify({schemaVersion:1,id:crypto.randomUUID(),name:'PWM simulation fixture',profileId:'esp32-devkit-reference',mode:'blocks',source:'',workspace:programWorkspace(program),revision:0}));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=join(root,'workspace');const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);page.on('dialog',d=>d.accept());await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},path);await page.getByRole('button',{name:'Open project',exact:true}).click();await expect(page.getByLabel('Project name')).toHaveValue('PWM simulation fixture');await runIndicatorExperiment(page);await expect(page.locator('.output')).toContainText('0 s | pwm channel 1: 25 %');await expect(page.locator('.output')).toContainText('0.02 s | pwm channel 2: 75 %');await page.getByRole('button',{name:'Simulator',exact:true}).click();await openSimulationTools(page);await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText('"status": "completed"');await expect(page.locator('.simulator-workspace pre')).toContainText('"ledDuty": 25');await expect(page.locator('.simulator-workspace pre')).toContainText('"ledSecondaryDuty": 75');}
 finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
