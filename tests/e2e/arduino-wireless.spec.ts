import {test,expect,_electron as electron,type ElectronApplication,type Page} from '@playwright/test';
import {openArduinoTemplates,openStudioProgram} from './helpers/studio';
import {mkdtemp,rm} from 'node:fs/promises';
import {basename,join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import type {WirelessProgram,WirelessState} from '../../packages/contracts/arduino-wireless';
import type {Project} from '../../packages/contracts';

type Fixture={
 openMode:'valid'|'wrong'|'malformed'|'pending';runMode:'pending'|'malformed';
 state:WirelessState;programs:WirelessProgram[];compileProjects:Project[];
 stops:number;closes:number;serialCloses:number;nativeCalls:number;
 finishRun:((value:unknown)=>void)|null;
 finishOpen:(()=>void)|null;
};
type FixtureGlobal=typeof globalThis&{wirelessFixture:Fixture};

async function start(){
 const root=await mkdtemp(join(tmpdir(),'jective-wireless-ui-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});const page=await app.firstWindow();
 await app.evaluate(({BrowserWindow,ipcMain})=>{
  const window=BrowserWindow.getAllWindows()[0]!;window.setFocusable(false);window.setPosition(-12000,-12000);window.webContents.setBackgroundThrottling(false);window.showInactive();
  const fixture:Fixture={openMode:'valid',runMode:'pending',state:{status:'ready',sent:0,total:0},programs:[],compileProjects:[],stops:0,closes:0,serialCloses:0,nativeCalls:0,finishRun:null,finishOpen:null};
  (globalThis as FixtureGlobal).wirelessFixture=fixture;
  ipcMain.removeHandler('devices:list');ipcMain.handle('devices:list',()=>({ok:true,value:[{path:'HC05_WIRELESS_TEST',transport:'bluetooth',bluetoothDirection:'outgoing',bluetoothName:'HC-05'}]}));
  ipcMain.removeHandler('serial:close');ipcMain.handle('serial:close',()=>{fixture.serialCloses++;return {ok:true,value:true};});
  ipcMain.removeHandler('wireless:open');ipcMain.handle('wireless:open',(_event,request)=>{
   if(request.path!=='HC05_WIRELESS_TEST')throw new Error('UNEXPECTED_PORT');
   if(fixture.openMode==='wrong')return {ok:false,error:{code:'WIRELESS_FIRMWARE_UNAVAILABLE',message:'WIRELESS_FIRMWARE_UNAVAILABLE'}};
   if(fixture.openMode==='malformed')return {ok:true,value:{id:'invalid-session',port:request.path,version:99}};
   fixture.state={status:'ready',sent:0,total:0};
   const opened={ok:true,value:{id:'da26bac1-0aee-4d45-b44a-00f4189ea9cc',port:request.path,version:1}};
   if(fixture.openMode==='pending')return new Promise(done=>{fixture.finishOpen=()=>done(opened);});
   return opened;
  });
  ipcMain.removeHandler('wireless:run');ipcMain.handle('wireless:run',(_event,request)=>{
   if(request.sessionId!=='da26bac1-0aee-4d45-b44a-00f4189ea9cc')throw new Error('UNEXPECTED_SESSION');
   fixture.programs.push(request.program);
   if(fixture.runMode==='malformed')return {ok:true,value:{status:'running',sent:999,total:4}};
   fixture.state={status:'uploading',sent:1,total:request.program.steps.length};
   return new Promise<unknown>(done=>{fixture.finishRun=done;});
  });
  ipcMain.removeHandler('wireless:keepalive');ipcMain.handle('wireless:keepalive',()=>({ok:true,value:fixture.state}));
  ipcMain.removeHandler('wireless:stop');ipcMain.handle('wireless:stop',()=>{fixture.stops++;fixture.state={...fixture.state,status:'stopped'};return {ok:true,value:fixture.state};});
  ipcMain.removeHandler('wireless:close');ipcMain.handle('wireless:close',()=>{fixture.closes++;fixture.state={...fixture.state,status:'stopped'};return {ok:true,value:true};});
  ipcMain.removeHandler('build:compile');ipcMain.handle('build:compile',(_event,project)=>{
   fixture.compileProjects.push(project);return {ok:true,value:{operationId:'190c44a3-0599-4832-a46a-6c32ea6ce72e',state:'succeeded',log:'UI fixture: runtime compiled; no hardware access',sourceHash:'0'.repeat(64),artifacts:['sketch.ino.hex','sketch.ino.elf'],exitCode:0}};
  });
  for(const channel of ['device:upload','serial:open','serial:send','arduino:open']){ipcMain.removeHandler(channel);ipcMain.handle(channel,()=>{fixture.nativeCalls++;throw new Error('REAL_HARDWARE_FORBIDDEN_IN_UI_TEST');});}
 });
 page.on('dialog',dialog=>dialog.accept());await expect(page.locator('#launch-screen')).toHaveCount(0,{timeout:20000});await page.locator('main>header>label>select').selectOption('en');
 return {app,page,root};
}

async function finish(app:ElectronApplication,root:string){
 await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));
 if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-wireless-ui-'))throw new Error('UNSAFE_CLEANUP');
 await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
}

async function createBlocks(page:Page){
 const starter=await openArduinoTemplates(page);
 await starter.getByRole('button',{name:'New robot program (Blocks)',exact:true}).click();
 await expect(page.locator('#studio-bluetooth')).toBeVisible();
 await expect(page.locator('dialog[open]')).toHaveCount(0);
}

async function resolveRun(app:ElectronApplication,status:'running'|'completed'='running',keepState=false){
 await app.evaluate((_electron,{status,keepState})=>{
  const fixture=(globalThis as FixtureGlobal).wirelessFixture;
  const next:WirelessState={status,sent:fixture.programs.at(-1)!.steps.length,total:fixture.programs.at(-1)!.steps.length};
  if(!keepState)fixture.state=next;
  const done=fixture.finishRun;fixture.finishRun=null;if(!done)throw new Error('NO_PENDING_RUN');done({ok:true,value:next});
 },{status,keepState});
}

test('wireless Blocks flow keeps the project, sends commands, reports progress and stops pending or active runs',async()=>{
 const {app,page,root}=await start();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 try{
  await createBlocks(page);const panel=page.locator('#studio-bluetooth');
  const originalSource=await page.locator('.studio .monaco-editor').getAttribute('data-source');
  await panel.getByRole('button',{name:'Robot setup',exact:true}).click();
  await panel.getByText('Install by USB (once)',{exact:true}).click();
  await panel.getByRole('button',{name:'Compile program',exact:true}).click();
  await expect(panel.getByText('✓ Program checked. Ready to upload.',{exact:true})).toBeVisible();
  expect(await page.locator('.studio .monaco-editor').getAttribute('data-source')).toBe(originalSource);
  const runtime=await app.evaluate(()=>(globalThis as FixtureGlobal).wirelessFixture.compileProjects[0]!);expect(runtime.mode).toBe('code');expect(runtime.source).toContain('SoftwareSerial');
  await panel.getByRole('button',{name:'Robot setup',exact:true}).click();
  await expect(panel.getByLabel('HC-05 port',{exact:true})).toHaveCount(0);
  await panel.getByRole('button',{name:'Run via Bluetooth',exact:true}).click();await expect(panel.locator('.wireless-state')).toHaveText('Sending · 1/4');
  expect(await app.evaluate(()=>(globalThis as FixtureGlobal).wirelessFixture.programs[0])).toEqual({version:1,loopStart:-1,steps:[{op:'w',a:1000,b:0},{op:'m',a:89,b:89},{op:'w',a:500,b:0},{op:'s',a:0,b:0}]});
  await resolveRun(app);await expect(panel.locator('.wireless-state')).toHaveText('Program running');
  await page.screenshot({path:'test-results/arduino-wireless.png'});
  await app.evaluate(()=>{const fixture=(globalThis as FixtureGlobal).wirelessFixture;fixture.state={...fixture.state,status:'completed'};});
  await expect(panel.locator('.wireless-state')).toHaveText('Program completed');
  await panel.getByRole('button',{name:'Run via Bluetooth',exact:true}).press('Space');await expect(panel.locator('.wireless-state')).toContainText('Sending');
  await panel.getByRole('button',{name:'STOP',exact:true}).click();await expect(panel.locator('.wireless-state')).toHaveText('Stopped');
  await resolveRun(app,'running',true);await expect(panel.getByRole('button',{name:'Run via Bluetooth',exact:true})).toBeEnabled();await expect(panel.locator('.wireless-state')).toHaveText('Stopped');
  await panel.getByRole('button',{name:'Run via Bluetooth',exact:true}).click();await expect.poll(()=>app.evaluate(()=>(globalThis as FixtureGlobal).wirelessFixture.programs.length)).toBe(3);await resolveRun(app);
  await expect(panel.locator('.wireless-state')).toContainText('Program running');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(panel.locator('.wireless-state')).toHaveText('Stopped');
  await page.locator('main>nav').getByRole('button',{name:'Robot control',exact:true}).click();
  await expect.poll(()=>app.evaluate(()=>(globalThis as FixtureGlobal).wirelessFixture.closes)).toBe(1);
  const starter=await openArduinoTemplates(page);await starter.getByRole('button',{name:'New robot program (C++ / Bluetooth)',exact:true}).click();
  await expect(page.getByRole('button',{name:'Run via Bluetooth',exact:true})).toHaveCount(0);
  const audit=await app.evaluate(()=>{const fixture=(globalThis as FixtureGlobal).wirelessFixture;return {stops:fixture.stops,nativeCalls:fixture.nativeCalls,serialCloses:fixture.serialCloses};});
  expect(audit.stops).toBeGreaterThanOrEqual(2);expect(audit.serialCloses).toBe(0);expect(audit.nativeCalls).toBe(0);expect(errors).toEqual([]);
 }finally{await finish(app,root);}
});

test('an ordinary Blocks project sends over Bluetooth without a robot template',async()=>{
 const {app,page,root}=await start();
 try{
  await openStudioProgram(page);
  const panel=page.locator('#studio-bluetooth');

  await panel.getByRole('button',{name:'Run via Bluetooth',exact:true}).click();
  await expect.poll(()=>app.evaluate(()=>(globalThis as FixtureGlobal).wirelessFixture.programs.length)).toBe(1);
  await resolveRun(app,'completed');
  await expect(panel.locator('.wireless-state')).toContainText('Program completed');
 }finally{await finish(app,root);}
});

test('wrong firmware and malformed wireless responses cannot enable a successful run',async()=>{
 const {app,page,root}=await start();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 try{
  await createBlocks(page);const panel=page.locator('#studio-bluetooth');
  await app.evaluate(()=>{(globalThis as FixtureGlobal).wirelessFixture.openMode='wrong';});await panel.getByRole('button',{name:'Run via Bluetooth',exact:true}).click();
  await expect(panel.getByRole('alert')).toHaveText('The robot did not answer, so check that it is on and set up for this mode.');await expect(panel.getByRole('button',{name:'STOP',exact:true})).toHaveCount(0);
  await app.evaluate(()=>{(globalThis as FixtureGlobal).wirelessFixture.openMode='malformed';});await panel.getByRole('button',{name:'Run via Bluetooth',exact:true}).click();
  await expect(panel.getByRole('alert')).toHaveText('Could not connect to the robot, so check that it is on.');await expect(panel.locator('.wireless-state')).toHaveCount(0);await expect(panel.getByRole('button',{name:'STOP',exact:true})).toHaveCount(0);
  await app.evaluate(()=>{const fixture=(globalThis as FixtureGlobal).wirelessFixture;fixture.openMode='valid';fixture.runMode='malformed';});await panel.getByRole('button',{name:'Run via Bluetooth',exact:true}).click();
  await expect(panel.getByRole('alert')).toHaveText('Could not send the program to the robot.');await expect(panel.locator('.wireless-state')).toHaveCount(0);
  expect(await app.evaluate(()=>(globalThis as FixtureGlobal).wirelessFixture.nativeCalls)).toBe(0);expect(errors).toEqual([]);
 }finally{await finish(app,root);}
});

test('wireless port picker names HC-05 and excludes USB and incoming Bluetooth ports',async()=>{
 const {app,page,root}=await start();
 try{
  await app.evaluate(({ipcMain})=>{
   ipcMain.removeHandler('devices:list');ipcMain.handle('devices:list',()=>({ok:true,value:[
    {path:'COM5',transport:'usb',friendlyName:'USB-SERIAL CH340'},
    {path:'COM6',transport:'bluetooth',bluetoothDirection:'incoming'},
    {path:'COM13',transport:'bluetooth',bluetoothDirection:'outgoing',bluetoothName:'Galaxy Buds2'},
    {path:'COM3',transport:'bluetooth',bluetoothDirection:'outgoing',bluetoothName:'HC-05'},
   ]}));
  });
  await createBlocks(page);const panel=page.locator('#studio-bluetooth'),picker=panel.getByLabel('HC-05 port',{exact:true});
  await panel.getByRole('button',{name:'Robot setup',exact:true}).click();
  await expect(picker).toHaveValue('COM3');
  await expect(picker.locator('option[value="COM3"]')).toHaveText('COM3 · HC-05 · Bluetooth · outgoing');
  await expect(picker.locator('option[value="COM5"]')).toHaveCount(0);
  await expect(picker.locator('option[value="COM6"]')).toHaveCount(0);
  await expect(picker.locator('option[value="COM13"]')).toContainText('Galaxy Buds2');
  await panel.getByText('Install by USB (once)',{exact:true}).click();
  await expect(panel.getByLabel('USB port',{exact:true}).locator('option[value="COM5"]')).toHaveText('COM5 · USB-SERIAL CH340 · USB');
  expect(await app.evaluate(()=>(globalThis as FixtureGlobal).wirelessFixture.nativeCalls)).toBe(0);
 }finally{await finish(app,root);}
});

test('one-click run finds a newly paired robot and STOP cancels a pending connection',async()=>{
 const {app,page,root}=await start();
 try{
  await app.evaluate(({ipcMain})=>{
   const state=globalThis as FixtureGlobal&{paired:boolean};state.paired=false;
   ipcMain.removeHandler('devices:list');ipcMain.handle('devices:list',()=>({ok:true,value:state.paired
    ?[{path:'HC05_WIRELESS_TEST',transport:'bluetooth',bluetoothDirection:'outgoing',bluetoothName:'HC-05'}]:[]}));
   state.wirelessFixture.openMode='pending';
  });
  await createBlocks(page);
  const panel=page.locator('#studio-bluetooth'),run=panel.getByRole('button',{name:'Run via Bluetooth',exact:true});
  await run.click();
  await expect(panel.getByLabel('HC-05 port',{exact:true})).toHaveValue('');
  await app.evaluate(()=>{(globalThis as FixtureGlobal&{paired:boolean}).paired=true;});
  await run.click();
  await expect.poll(()=>app.evaluate(()=>!!(globalThis as FixtureGlobal).wirelessFixture.finishOpen)).toBe(true);
  await panel.getByRole('button',{name:'STOP',exact:true}).click();
  await app.evaluate(()=>{const fixture=(globalThis as FixtureGlobal).wirelessFixture;fixture.finishOpen?.();fixture.finishOpen=null;});
  await expect(run).toBeEnabled();
  expect(await app.evaluate(()=>{const fixture=(globalThis as FixtureGlobal).wirelessFixture;return [fixture.closes,fixture.programs.length];})).toEqual([1,0]);
 }finally{await finish(app,root);}
});
