import {test,expect,_electron as electron} from '@playwright/test';
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
  await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();
  const starter=page.locator('.studio .arduino-starter');await starter.locator('summary').click();
  await starter.getByRole('button',{name:'New robot program (Blocks)',exact:true}).click();
  await page.getByRole('button',{name:'Blocks + code',exact:true}).click();
  await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',/j_motor_drive\(35, 35\)/);
  await expect(page.locator('.studio .blocklyWorkspace .blocklyBlockCanvas').first()).not.toContainText('(simulation)');
  await starter.getByRole('button',{name:'New robot program (C++ / Bluetooth)',exact:true}).click();
  await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',/COMMAND_TIMEOUT_MS = 350/);
  await page.locator('.student-settings>summary').click();await expect(page.getByLabel('Board',{exact:true})).toHaveValue('arduino-uno');
  await page.getByLabel('Language',{exact:true}).selectOption('ru');await expect(page.locator('.workspace-heading h1')).toHaveText('My Arduino Uno robot');
  await page.locator('.board-run-launch').click();const dialog=page.locator('#board-run-dialog');
  await expect(dialog.getByRole('button',{name:'Подготовить инструменты Arduino',exact:true})).toBeVisible();
  await page.locator('main>header>label>select').selectOption('en',{force:true});
  await dialog.getByText('Board monitor',{exact:true}).click();await expect(dialog.getByLabel('Speed',{exact:true})).toHaveValue('9600');
  if(process.env.JECTIVE_TEST_UNO_SDK){
   await dialog.getByRole('button',{name:'Prepare Arduino tools',exact:true}).click();await expect(dialog.locator('.board-status')).toContainText('Tools ready',{timeout:20000});
   await dialog.getByRole('button',{name:'Compile program',exact:true}).click();await expect(dialog.getByText('✓ Program checked. Ready to upload.',{exact:true})).toBeVisible({timeout:120000});
  }
  await expect(dialog.getByRole('button',{name:'Upload and run on board',exact:true})).toBeDisabled();
  await dialog.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByLabel('Board',{exact:true}).selectOption('esp32-devkit-reference');await expect(page.getByLabel('Board',{exact:true})).toHaveValue('esp32-devkit-reference');
  expect(errors).toEqual([]);
 }finally{
  await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-uno-starter-'))throw new Error('UNSAFE_CLEANUP');
  await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
