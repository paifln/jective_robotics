import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L14 exposes its unit defect and exports the actual reference series and plot',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-analog-lesson-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',d=>d.accept());await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  for(const repaired of [false,true]){
   await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L14 ·/}).click();await page.getByRole('button',{name:repaired?'Load reference solution':'Load starter',exact:true}).click();await expect(page.getByLabel('Project name')).toHaveValue('L14 learner project');await page.getByRole('button',{name:'Simulation',exact:true}).click();await expect(page.getByLabel('World',{exact:true})).toHaveValue('L14-noisy-voltage-step');await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.feature pre')).toContainText('"status": "completed"');
   if(!repaired)await expect(page.locator('.feature').getByRole('alert')).toContainText('ANALOG_RECORDED_SAMPLE_INVALID');
  }
  const plot=page.locator('.analog-plot');await expect(plot).toContainText('3.3 V');await plot.screenshot({path:'test-results/L14-analog-plot.png'});
  for(const [label,file] of [['Export analog CSV','series.csv'],['Export analog SVG','plot.svg']]){
   const path=join(root,file!);await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},path);await page.getByRole('button',{name:label!,exact:true}).click();await expect.poll(async()=>{try{return (await readFile(path,'utf8')).length;}catch{return 0;}}).toBeGreaterThan(20);
  }
  const csv=await readFile(join(root,'series.csv'),'utf8');expect(csv.split('\r\n')).toHaveLength(101);expect(csv).toContain('"simulation","1980",');const svg=await readFile(join(root,'plot.svg'),'utf8');expect(svg).toContain('<svg');expect(svg).toContain('Recorded analog simulation');expect(svg).toContain('3.3 V');expect(svg).toContain('Simulation time (ms)');
  await copyFile(join(root,'series.csv'),'test-results/L14-exported.csv');await copyFile(join(root,'plot.svg'),'test-results/L14-exported.svg');
  await page.getByText('Edit scenario JSON (start, goal, obstacles and line)',{exact:true}).click();await page.getByRole('button',{name:'Load current',exact:true}).click();const scenario=JSON.parse(await page.getByLabel('Scenario JSON').inputValue());await page.getByLabel('Scenario JSON').fill(JSON.stringify({...scenario,analog:{...scenario.analog,inputVolts:5}}));await page.getByRole('button',{name:'Apply scenario',exact:true}).click();await expect(page.locator('.feature pre')).toContainText('ANALOG_VOLTAGE_INCOMPATIBLE');
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
