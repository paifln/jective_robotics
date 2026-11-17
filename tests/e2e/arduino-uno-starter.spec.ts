import {test,expect,_electron as electron} from '@playwright/test';
import {openArduinoTemplates} from './helpers/studio';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {englishWorkspace} from './helpers/learning';
import {parkVerificationWindow} from './helpers/window';

test('Uno starters select real hardware code, compile through the UI and retain ESP32 selection',async()=>{
 test.setTimeout(180000);
 const root=await mkdtemp(join(tmpdir(),'jective-uno-starter-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));
 delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 if(process.env.JECTIVE_TEST_UNO_SDK)env.JECTIVE_TOOLCHAIN_ROOT=process.env.JECTIVE_TEST_UNO_SDK;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  await parkVerificationWindow(app);await englishWorkspace(page);
  await app.evaluate(({ipcMain})=>{ipcMain.removeHandler('devices:list');ipcMain.handle('devices:list',()=>({ok:true,value:[]}));});
  const board=page.locator('main>header').getByLabel('Board',{exact:true});
  await expect(board).toBeVisible();
  await board.selectOption('arduino-nano');
  await expect(board).toHaveValue('arduino-nano');
  const starter=await openArduinoTemplates(page);
  await starter.getByRole('button',{name:'New robot program (Blocks)',exact:true}).click();
  await page.getByRole('button',{name:'Blocks + code',exact:true}).click();
  await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',/j_motor_drive\(35, 35\)/);
  await expect(page.locator('.studio .blocklyWorkspace .blocklyBlockCanvas').first()).not.toContainText('(simulation)');
  await openArduinoTemplates(page);
  await starter.getByRole('button',{name:'New robot program (C++ / Bluetooth)',exact:true}).click();
  await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',/COMMAND_TIMEOUT_MS = 350/);
  await page.locator('.student-settings>summary').click();await expect(page.getByLabel('Board',{exact:true})).toHaveValue('arduino-uno');
  await page.getByLabel('Language',{exact:true}).selectOption('ru');await expect(page.locator('.workspace-heading h1')).toHaveText('My Arduino Uno robot');
  await expect(page.locator('.board-run-launch')).toBeDisabled();
  const nav=page.locator('main>nav');
  await nav.getByRole('button',{name:"Сериал-монитор",exact:true}).click();
  await page.locator('main>header>label>select').selectOption('en');
  await expect(page.locator('.serial-workspace').getByLabel('Speed',{exact:true})).toHaveValue('9600');
  await nav.getByRole('button',{name:'Studio',exact:true}).click();
  const settings=page.locator('.student-settings');
  await expect(settings.getByRole('button',{name:'Prepare Arduino tools',exact:true})).toBeVisible();
  if(process.env.JECTIVE_TEST_UNO_SDK){
   await settings.getByRole('button',{name:'Prepare Arduino tools',exact:true}).click();
   await expect(page.locator('.output')).toContainText('arduino:avr',{timeout:20000});
   await page.locator('.studio-actions').getByRole('button',{name:/^Compile/}).click();
   await expect(page.locator('.output')).toContainText('State: succeeded',{timeout:120000});
  }
  await page.getByLabel('Board',{exact:true}).selectOption('esp32-devkit-reference');await expect(page.getByLabel('Board',{exact:true})).toHaveValue('esp32-devkit-reference');
  expect(errors).toEqual([]);
 }finally{
  await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-uno-starter-'))throw new Error('UNSAFE_CLEANUP');
  await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
