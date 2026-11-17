import {test,expect,_electron as electron} from '@playwright/test';
import {openArduinoTemplates} from './helpers/studio';
import {mkdtemp,rm} from 'node:fs/promises';
import {basename,join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';

type ControlFixture={commands:string[];closed:number;nativeCalls:number};

test('Arduino starter and control stop on pointer release, key release, emergency, focus loss and navigation without opening hardware',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-arduino-control-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  await app.evaluate(({BrowserWindow,ipcMain})=>{
   const window=BrowserWindow.getAllWindows()[0]!;window.setFocusable(false);window.setPosition(-12000,-12000);window.webContents.setBackgroundThrottling(false);window.showInactive();
   const state=globalThis as typeof globalThis&{arduinoFixture:ControlFixture};state.arduinoFixture={commands:[],closed:0,nativeCalls:0};
   ipcMain.removeHandler('devices:list');ipcMain.handle('devices:list',()=>({ok:true,value:[
    {path:'HC05_TEST_ONLY',transport:'bluetooth',bluetoothDirection:'outgoing',bluetoothName:'HC-05'},
    {path:'USB_TEST_ONLY',transport:'usb'},
   ]}));
   ipcMain.removeHandler('arduino:open');ipcMain.handle('arduino:open',(_event,request)=>{if(request.path!=='HC05_TEST_ONLY')throw new Error('UNEXPECTED_FIXTURE_PORT');return {ok:true,value:{id:'90680db4-bc85-43a1-8ab9-99c185f9bb41',port:request.path}};});
   ipcMain.removeHandler('arduino:command');ipcMain.handle('arduino:command',(_event,request)=>{if(!/^[FBLRS]$/.test(request.command))throw new Error('NON_ASCII_ROBOT_COMMAND');state.arduinoFixture.commands.push(request.command);return {ok:true,value:true};});
   ipcMain.removeHandler('arduino:close');ipcMain.handle('arduino:close',()=>{state.arduinoFixture.closed++;state.arduinoFixture.commands.push('S');return {ok:true,value:true};});
   const build={operationId:'79c3c84b-06ef-4b89-80f2-e25f898605b1',sourceHash:'fixture',state:'succeeded',exitCode:0,log:'Compile fixture',artifacts:[]};
   ipcMain.removeHandler('build:compile');
   ipcMain.handle('build:compile',(_event,project)=>{
    if(project.profileId!=='arduino-uno'||!project.source.includes('COMMAND_TIMEOUT_MS'))throw new Error('EXPECTED_CONTROLLER_FIRMWARE');
    return {ok:true,value:build};
   });
   ipcMain.removeHandler('device:upload');
   ipcMain.handle('device:upload',(_event,request)=>{
    if(request.project.profileId!=='arduino-uno'||!request.project.source.includes('COMMAND_TIMEOUT_MS')||request.port!=='USB_TEST_ONLY'||request.operationId!==build.operationId||request.mode!=='run')throw new Error('UNEXPECTED_UPLOAD_TARGET');
    return {ok:true,value:{...build,log:'Upload fixture'}};
   });
   for(const channel of ['serial:open','serial:send']){ipcMain.removeHandler(channel);ipcMain.handle(channel,()=>{state.arduinoFixture.nativeCalls++;throw new Error('HARDWARE_ACCESS_FORBIDDEN_IN_UI_FIXTURE');});}
  });
  const commands=()=>app.evaluate(()=>(globalThis as typeof globalThis&{arduinoFixture:ControlFixture}).arduinoFixture.commands);
  const reset=()=>app.evaluate(()=>{(globalThis as typeof globalThis&{arduinoFixture:ControlFixture}).arduinoFixture.commands=[];});
  await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('main>header>label>select').selectOption('en');
  const navigation=page.locator('main>nav');
  await navigation.getByRole('button',{name:'Robot control',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Robot control',exact:true})).toBeVisible();
  const starter=await openArduinoTemplates(page);
  await starter.getByRole('button',{name:'New robot program (Blocks)',exact:true}).click();
  await expect(page.getByRole('button',{name:'Run via Bluetooth',exact:true})).toBeEnabled();
  await page.getByRole('combobox',{name:'USB port',exact:true}).selectOption('USB_TEST_ONLY');
  await navigation.getByRole('button',{name:'Robot control',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'USB port',exact:true})).toHaveValue('USB_TEST_ONLY');
  await page.getByRole('button',{name:'Install controller firmware via USB',exact:true}).click();
  await expect(page.locator('.robot-board-status')).toContainText('Uploaded to USB_TEST_ONLY');
  const control=page.locator('.arduino-robot-control');await expect(control).toContainText('Install the controller firmware via USB, then select the HC-05 port and connect.');await control.getByLabel('HC-05 COM port',{exact:true}).selectOption('HC05_TEST_ONLY');await control.getByRole('button',{name:'Connect · 9600',exact:true}).click();await expect(control.locator('.arduino-drive-status')).toHaveText('HC05_TEST_ONLY · Stopped');
  const forward=control.getByRole('button',{name:'Forward',exact:true});
  const right=control.getByRole('button',{name:'Right',exact:true});
  const preview=control.locator('.arduino-drive-preview canvas');
  const robotCenter=()=>preview.evaluate((canvas:HTMLCanvasElement)=>{
   const {width,height}=canvas;
   const pixels=canvas.getContext('2d')!.getImageData(0,0,width,height).data;
   let x=0,y=0,count=0;
   for(let i=0;i<pixels.length;i+=4){
    if(pixels[i+3]!==255)continue;
    const pixel=i/4;
    x+=pixel%width;
    y+=Math.floor(pixel/width);
    count++;
   }
   return {x:x/count,y:y/count};
  });
  const initialCenter=await robotCenter();
  await reset();
  await forward.scrollIntoViewIfNeeded();
  const [forwardBox,rightBox]=await Promise.all([forward.boundingBox(),right.boundingBox()]);
  if(!forwardBox||!rightBox)throw new Error('MISSING_CONTROL_BUTTON');
  await page.mouse.move(forwardBox.x+forwardBox.width/2,forwardBox.y+forwardBox.height/2);
  await page.mouse.down();
  await expect.poll(async()=>commands().then(value=>value.at(-1))).toBe('F');
  await expect(forward).toHaveAttribute('aria-pressed','true');
  await expect.poll(async()=>(await robotCenter()).y).toBeLessThan(initialCenter.y-12);
  await page.mouse.move(rightBox.x+rightBox.width/2,rightBox.y+rightBox.height/2);
  await expect.poll(async()=>commands().then(value=>value.at(-1))).toBe('R');
  await expect(right).toHaveAttribute('aria-pressed','true');
  await expect.poll(async()=>(await robotCenter()).x).toBeGreaterThan(initialCenter.x+12);
  await page.mouse.up();
  await expect.poll(async()=>commands().then(value=>value.at(-1))).toBe('S');
  await expect(right).toHaveAttribute('aria-pressed','false');
  const stoppedCenter=await robotCenter();
  await page.waitForTimeout(120);
  expect(await robotCenter()).toEqual(stoppedCenter);
  await reset();await page.keyboard.down('w');await expect.poll(async()=>commands().then(value=>value.filter(command=>command==='F').length)).toBeGreaterThanOrEqual(2);await page.keyboard.up('w');await expect.poll(async()=>commands().then(value=>value.at(-1))).toBe('S');
  await page.keyboard.down('w');await expect.poll(async()=>commands().then(value=>value.at(-1))).toBe('F');await control.getByRole('button',{name:'STOP',exact:true}).click();await expect.poll(async()=>commands().then(value=>value.at(-1))).toBe('S');await reset();await page.keyboard.down('w');await page.waitForTimeout(180);expect(await commands()).not.toContain('F');await page.keyboard.up('w');await page.keyboard.down('w');await expect.poll(async()=>commands().then(value=>value.at(-1))).toBe('F');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect.poll(async()=>commands().then(value=>value.at(-1))).toBe('S');await reset();await page.keyboard.down('w');await page.waitForTimeout(180);expect(await commands()).not.toContain('F');await page.keyboard.up('w');
  await page.keyboard.down('d');await expect.poll(async()=>commands().then(value=>value.at(-1))).toBe('R');await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await page.keyboard.up('d');await expect.poll(()=>app.evaluate(()=>(globalThis as typeof globalThis&{arduinoFixture:ControlFixture}).arduinoFixture.closed)).toBe(1);await expect.poll(async()=>commands().then(value=>value.at(-1))).toBe('S');
  expect(await app.evaluate(()=>(globalThis as typeof globalThis&{arduinoFixture:ControlFixture}).arduinoFixture.nativeCalls)).toBe(0);expect(errors).toEqual([]);
 }finally{
  await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-arduino-control-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
