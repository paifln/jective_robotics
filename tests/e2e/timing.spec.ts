import {parkVerificationWindow} from './helpers/window';
import {runIndicatorExperiment} from './helpers/simulation';
import {prepareProgrammingWorkspace,startLessonProject} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L04 reference runs both channels through the actual indicator worker',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-timing-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);page.on('dialog',dialog=>dialog.accept());
  await expect(page.locator('.monaco-editor').first()).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await page.getByRole('button',{name:'Learn',exact:true}).click();
  await page.getByRole('button',{name:/^L04 ·/}).click();
  await page.getByText('Cooperative timing comparison — reviewed pin definitions required',{exact:true}).click();
  const templatePath=join(root,'cooperative.ino');
  await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},templatePath);
  await page.getByRole('button',{name:'Export cooperative source template',exact:true}).click();
  await expect.poll(async()=>{try{return (await readFile(templatePath,'utf8')).includes('#error Define JECTIVE_STOP_PIN');}catch{return false;}}).toBe(true);
  await startLessonProject(page,true);
  await expect(page.getByLabel('Project name')).toHaveValue('L04 · My experiment');
  await expect(page.getByRole('button',{name:'Compile — check code for the board',exact:true})).toBeDisabled();
  await runIndicatorExperiment(page);
  await expect(page.getByText(/300 ms \| led channel 2: true/)).toBeVisible();
  await expect(page.getByText(/1300 ms \| led channel 2: true/)).toBeVisible();
  const destination=join(root,'trace.json');
  await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},destination);
  await page.getByRole('button',{name:'Export simulation trace',exact:true}).click();
  await expect.poll(async()=>{try{return JSON.parse(await readFile(destination,'utf8')).origin;}catch{return null;}}).toBe('simulation');
  const trace=JSON.parse(await readFile(destination,'utf8'));
  expect(trace.projectName).toBe('L04 · My experiment');
  expect(trace.program.loop.some((i:{kind:string;channel?:number})=>i.kind==='led'&&i.channel===2)).toBe(true);
  expect(trace.trace.filter((e:{kind:string;value:boolean;timeMs:number})=>e.kind==='led'&&e.value===true).slice(0,4).map((e:{timeMs:number;channel?:number})=>[e.timeMs,e.channel??1])).toEqual([[0,1],[300,2],[1000,1],[1300,2]]);
 }finally{await app.evaluate(({app})=>app.exit(0));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
