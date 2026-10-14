import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {programWorkspace} from '../../apps/desktop/renderer/blocks';
import {worlds} from '../../packages/simulator';
import type {Program} from '../../packages/codegen';
test('recorded analog variables produce a unit-labeled plot and actual simulation CSV',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-analog-plot-')),path=join(root,'analog.jective.json');
 const program:Program={setup:[{kind:'repeat',count:10,body:[{kind:'set',name:'adc_time_ms',value:{kind:'sensor',sensor:'timeMs'}},{kind:'set',name:'adc_counts',value:{kind:'sensor',sensor:'analogCounts'}},{kind:'set',name:'adc_volts',value:{kind:'sensor',sensor:'analogVolts'}},{kind:'wait',ms:20}]}],loop:[]};
 await writeFile(path,JSON.stringify({schemaVersion:1,id:crypto.randomUUID(),name:'Analog sample fixture',profileId:'esp32-devkit-reference',mode:'blocks',source:'',workspace:programWorkspace(program),revision:0}));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=join(root,'workspace');const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',d=>d.accept());await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},path);await page.getByRole('button',{name:'Open project',exact:true}).click();await expect(page.getByLabel('Project name')).toHaveValue('Analog sample fixture');
  await page.getByRole('button',{name:'Simulation',exact:true}).click();await page.getByText('Edit scenario JSON (start, goal, obstacles and line)',{exact:true}).click();await page.getByLabel('Scenario JSON').fill(JSON.stringify({...worlds[0]!,analog:{referenceVolts:3.3,bits:12,inputVolts:1,noiseVolts:.02,seed:42,events:[{timeMs:100,inputVolts:2}]}}));await page.getByRole('button',{name:'Apply scenario',exact:true}).click();await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.feature pre')).toContainText('"status": "completed"');
  const plot=page.locator('.analog-plot');await expect(plot).toContainText('Simulation time (ms)');await expect(plot).toContainText('3.3 V');await expect(plot.locator('polyline')).toHaveAttribute('points',/\d/);await page.getByLabel('Plot units',{exact:true}).selectOption('counts');await expect(plot).toContainText('4095 counts');await plot.screenshot({path:'test-results/analog-plot.png'});
  const csvPath=join(root,'analog.csv');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},csvPath);await page.getByRole('button',{name:'Export analog CSV',exact:true}).click();await expect.poll(async()=>{try{return (await readFile(csvPath,'utf8')).split('\r\n').length;}catch{return 0;}}).toBe(11);const csv=await readFile(csvPath,'utf8');expect(csv).toContain('origin,time_ms,adc_counts,adc_volts');expect(csv).toContain('"simulation","0",');expect(csv).toContain('"simulation","180",');
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
