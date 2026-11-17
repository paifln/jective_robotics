import {test,expect,_electron as electron} from '@playwright/test';
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
   ipcMain.removeHandler('devices:list');ipcMain.handle('devices:list',()=>({ok:true,value:[{path:'HC05_TEST_ONLY'}]}));
   ipcMain.removeHandler('arduino:open');ipcMain.handle('arduino:open',(_event,request)=>{if(request.path!=='HC05_TEST_ONLY')throw new Error('UNEXPECTED_FIXTURE_PORT');return {ok:true,value:{id:'90680db4-bc85-43a1-8ab9-99c185f9bb41',port:request.path}};});
   ipcMain.removeHandler('arduino:command');ipcMain.handle('arduino:command',(_event,request)=>{if(!/^[FBLRS]$/.test(request.command))throw new Error('NON_ASCII_ROBOT_COMMAND');state.arduinoFixture.commands.push(request.command);return {ok:true,value:true};});
   ipcMain.removeHandler('arduino:close');ipcMain.handle('arduino:close',()=>{state.arduinoFixture.closed++;state.arduinoFixture.commands.push('S');return {ok:true,value:true};});
   for(const channel of ['serial:open','serial:send','device:upload']){ipcMain.removeHandler(channel);ipcMain.handle(channel,()=>{state.arduinoFixture.nativeCalls++;throw new Error('HARDWARE_ACCESS_FORBIDDEN_IN_UI_FIXTURE');});}
  });
  const commands=()=>app.evaluate(()=>(globalThis as typeof globalThis&{arduinoFixture:ControlFixture}).arduinoFixture.commands);
  const reset=()=>app.evaluate(()=>{(globalThis as typeof globalThis&{arduinoFixture:ControlFixture}).arduinoFixture.commands=[];});
  await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('main>header>label>select').selectOption('en');
  await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();
  await page.locator('.studio .arduino-starter>summary').click();await page.locator('.studio').getByRole('button',{name:'New robot program (C++ / Bluetooth)',exact:true}).click();
  await expect(page.locator('.studio h1')).toHaveText('My Arduino Uno robot');await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',/SoftwareSerial/);
  await page.locator('main>nav').getByRole('button',{name:'My board',exact:true}).click();
  const control=page.locator('.arduino-robot-control');await expect(control).toContainText('C++ / Bluetooth');await control.getByLabel('HC-05 COM port',{exact:true}).selectOption('HC05_TEST_ONLY');await control.getByRole('button',{name:'Connect · 9600',exact:true}).click();await expect(control.locator('.arduino-drive-status')).toHaveText('HC05_TEST_ONLY · Stopped');
  await reset();await control.getByRole('button',{name:'Forward',exact:true}).scrollIntoViewIfNeeded();const box=await control.getByRole('button',{name:'Forward',exact:true}).boundingBox();if(!box)throw new Error('MISSING_CONTROL_BUTTON');await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await expect.poll(async()=>commands().then(value=>value.at(-1))).toBe('F');await page.mouse.move(box.x+box.width+150,box.y+box.height+100);await page.mouse.up();await expect.poll(async()=>commands().then(value=>value.at(-1))).toBe('S');
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
