import {openSimulationTools} from './helpers/simulation';
import {englishWorkspace,programmingLesson,startLessonProject} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile,copyFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L14 exposes its unit defect and exports the actual reference series and plot',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-analog-lesson-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',d=>d.accept());await app.evaluate(({BrowserWindow})=>{const window=BrowserWindow.getAllWindows()[0]!;window.setFocusable(false);window.setPosition(-12000,-12000);window.webContents.setBackgroundThrottling(false);window.showInactive();});await englishWorkspace(page);
  for(const repaired of [false,true]){
   await programmingLesson(page,'L14');await startLessonProject(page,repaired);await expect(page.locator('.workspace-heading h1')).toContainText('L14');await page.locator('main>nav').getByRole('button',{name:'Simulator',exact:true}).click();await expect(page.getByLabel('World',{exact:true})).toHaveValue('L14-noisy-voltage-step');await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.locator('.simulation-diagnostics pre')).toContainText('"status": "completed"');
   if(!repaired)await expect(page.locator('.feature').getByRole('alert')).toContainText('ANALOG_RECORDED_SAMPLE_INVALID');
  }
  const plot=page.locator('.analog-plot');await expect(plot).toContainText('3.3 V');await plot.screenshot({path:'test-results/L14-analog-plot.png'});
  for(const [label,file] of [['Export analog CSV','series.csv'],['Export analog SVG','plot.svg']]){
   const path=join(root,file!);await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},path);await page.getByRole('button',{name:label!,exact:true}).click();await expect.poll(async()=>{try{return (await readFile(path,'utf8')).length;}catch{return 0;}}).toBeGreaterThan(20);
  }
  const csv=await readFile(join(root,'series.csv'),'utf8');expect(csv.split('\r\n')).toHaveLength(101);expect(csv).toContain('"simulation","1980",');const svg=await readFile(join(root,'plot.svg'),'utf8');expect(svg).toContain('<svg');expect(svg).toContain('Recorded analog simulation');expect(svg).toContain('3.3 V');expect(svg).toContain('Simulation time (ms)');
  await copyFile(join(root,'series.csv'),'test-results/L14-exported.csv');await copyFile(join(root,'plot.svg'),'test-results/L14-exported.svg');
  await openSimulationTools(page,'Edit field');const area=join(root,'area.json');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},area);await page.getByRole('button',{name:'Save practice area',exact:true}).click();await expect.poll(async()=>{try{return JSON.parse(await readFile(area,'utf8')).format;}catch{return '';}}).toBe('jective-world');const document=JSON.parse(await readFile(area,'utf8'));document.world.analog.inputVolts=5;await writeFile(area,JSON.stringify(document));await page.getByLabel('Practice area file',{exact:true}).setInputFiles(area);await expect(page.locator('.world-files').getByRole('alert')).toContainText('Your current area is unchanged');const unchanged=join(root,'unchanged.json');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},unchanged);await page.getByRole('button',{name:'Save practice area',exact:true}).click();await expect.poll(async()=>{try{return JSON.parse(await readFile(unchanged,'utf8')).world.analog.inputVolts;}catch{return null;}}).toBe(1);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
