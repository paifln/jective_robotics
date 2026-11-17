import {parkVerificationWindow} from './helpers/window';
import {openSimulationTools,runIndicatorExperiment} from './helpers/simulation';
import {prepareProgrammingWorkspace} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {programWorkspace} from '../../apps/desktop/renderer/blocks';
import {generateStudio} from '../../packages/codegen';
import type {FunctionProgram} from '../../packages/codegen/functions';
test('function blocks persist through actual project save/reopen and execute in both UI workers',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-functions-')),path=join(root,'functions.jective.json');
 const program:FunctionProgram={setup:[{kind:'call',name:'pulse',arguments:[{kind:'number',value:0}]},{kind:'call',name:'pulse',arguments:[{kind:'number',value:100}]},{kind:'print',text:'DONE'}],loop:[],functions:[{name:'pulse',parameters:['ms'],body:[{kind:'led',on:true},{kind:'waitValue',value:{kind:'variable',name:'ms'}},{kind:'led',on:false}]}]};
 await writeFile(path,JSON.stringify({schemaVersion:1,id:crypto.randomUUID(),name:'Reusable indicator functions',profileId:'esp32-devkit-reference',mode:'blocks',source:generateStudio(program,2),workspace:programWorkspace(program),revision:0}));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=join(root,'workspace');
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);page.on('dialog',dialog=>dialog.accept());await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},path);
  await page.getByRole('button',{name:'Open project',exact:true}).click();await expect(page.getByLabel('Project name')).toHaveValue('Reusable indicator functions');await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',new RegExp('void jf_pulse'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await runIndicatorExperiment(page);await expect(page.locator('.output')).toContainText('0.1 s | print: DONE');
  await page.getByRole('button',{name:'Save project',exact:true}).click();await expect(page.locator('.output')).toContainText('Saved revision');const saved=JSON.parse(await readFile(path,'utf8'));expect(saved.workspace.blocks.blocks.filter((b:{type:string})=>b.type==='jective_function')).toHaveLength(1);expect(saved.source).toContain('jf_pulse(');
  await page.getByRole('button',{name:'Open project',exact:true}).click();await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',new RegExp('void jf_pulse'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));await runIndicatorExperiment(page);await expect(page.locator('.output')).toContainText('0.1 s | print: DONE');
  await page.getByRole('button',{name:'Simulator',exact:true}).click();await openSimulationTools(page);await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText('"status": "completed"');await expect(page.locator('.simulator-workspace')).toContainText('DONE');
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
