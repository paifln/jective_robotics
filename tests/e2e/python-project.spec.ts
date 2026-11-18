import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test, expect, _electron as electron} from '@playwright/test';
import {openArduinoTemplates} from './helpers/studio';

test('Python editor runs Python 3, persists modules and uses the selected ESP32 port',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-python-'));
 const path=join(root,'python.jective.json');
 const env=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));
 delete env.ELECTRON_RUN_AS_NODE;
 env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try {
  const page=await app.firstWindow();
  page.on('dialog',dialog=>dialog.accept());
  await app.evaluate(({dialog},path)=>{
   dialog.showSaveDialog=async()=>({canceled:false,filePath:path});
   dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});
  },path);
  await app.evaluate(({ipcMain})=>{
   ipcMain.removeHandler('devices:list');
   ipcMain.handle('devices:list',()=>({ok:true,value:[{path:'COM42',transport:'usb'}]}));
  });
  await expect(page.locator('#launch-screen')).toHaveCount(0);
  await page.locator('main>header>label>select').selectOption('en');
  const templates=await openArduinoTemplates(page);
  await templates.getByRole('button',{name:'New Python project for Arduino Uno',exact:true}).click();
  const editor=page.locator('.studio .monaco-editor');
  await expect(editor).toHaveAttribute('data-file','main.py');
  const check=page.getByRole('button',{name:'Check Python syntax',exact:true});
  const output=page.locator('.output>pre');
  const write=async(source:string)=>{
   await editor.locator('textarea').focus();
   await page.keyboard.press('Control+A');
   const [header,...body]=source.split('\n');
   await page.keyboard.insertText(header!);
   for(const line of body) {
    await page.keyboard.press('Enter');
    await page.keyboard.insertText(line.trimStart());
   }
  };
  await write('def invalid(');
  await check.click();
  await expect(output).toContainText('SyntaxError');
  await page.getByRole('textbox',{name:'Module name',exact:true}).fill('helper');
  await page.getByRole('button',{name:'Add module',exact:true}).click();
  await expect(editor).toHaveAttribute('data-file','helper.py');
  const helper='data = {number: number ** 2 for number in range(5)}';
  await write(helper);
  await page.getByRole('tab',{name:'main.py',exact:true}).click();
  const source='from helper import data\nprint(input("Number: "), data[4])';
  await write(source);
  await expect(editor).toHaveAttribute('data-source',source);
  await page.getByRole('button',{name:'Run Python on computer',exact:true}).click();
  await expect(output).toContainText('Number:');
  await page.getByRole('textbox',{name:'Python console input',exact:true}).fill('Answer');
  await page.getByRole('button',{name:'Send input',exact:true}).click();
  await expect(output).toContainText('Answer 16');
  await expect(output).toContainText('Python operation completed');
  await page.getByRole('button',{name:'Save project',exact:true}).click();
  await expect(page.locator('.output>pre')).toContainText('Saved revision');
  expect(JSON.parse(await readFile(path,'utf8'))).toMatchObject({pythonSource:source,pythonTarget:'uno',pythonFiles:{'helper.py':helper}});
  await page.getByRole('button',{name:'Open project',exact:true}).click();
  await page.getByRole('tab',{name:'main.py',exact:true}).click();
  await expect(editor).toHaveAttribute('data-source',source);

  await app.evaluate(({ipcMain})=>{
   ipcMain.removeHandler('python:run');
   ipcMain.handle('python:run',(_event,request)=>{
    if(request.target!=='esp32'||request.port!=='COM42')throw new Error('Unexpected ESP32 target');
    if(request.action==='probe'||request.action==='install'){
     if(Object.keys(request.files).length!==0)throw new Error('Firmware requests should carry no project files');
     return {ok:true,value:{state:'succeeded',log:'ESP32 '+request.action+' fixture'}};
    }
    if(request.action!=='deploy'||!request.files['main.py'].includes('from machine import Pin'))throw new Error('Unexpected ESP32 deploy');
    return {ok:true,value:{state:'succeeded',log:'ESP32 deploy fixture'}};
   });
  });
  const espTemplates=await openArduinoTemplates(page);
  await espTemplates.getByRole('button',{name:'New MicroPython project for ESP32',exact:true}).click();
  await expect(editor).toHaveAttribute('data-source',/from machine import Pin/);
  await page.getByRole('combobox',{name:'USB port',exact:true}).selectOption('COM42');
  const setup=page.getByText('Board setup',{exact:true});
  await setup.click();
  await page.getByRole('button',{name:'Check MicroPython on board',exact:true}).click();
  await expect(output).toContainText('ESP32 probe fixture');
  await page.getByRole('button',{name:'Install MicroPython',exact:true}).click();
  await expect(output).toContainText('ESP32 install fixture');
  await setup.click();
  await page.getByRole('button',{name:'Upload to ESP32 and restart',exact:true}).click();
  await app.evaluate(({BrowserWindow})=>{
   const window=BrowserWindow.getAllWindows()[0]!;
   window.setMinimumSize(640,650);
   window.setSize(660,740);
  });
  await setup.click();
  for(const locale of ['ru','kk']){
   await page.locator('main>header>label>select').selectOption(locale);
   const actions=page.locator('.python-device-actions');
   await expect(actions).toBeVisible();
   expect(await actions.evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);
   const overflowing=await actions.getByRole('button').evaluateAll(buttons=>buttons
    .filter(button=>(button as HTMLElement).offsetWidth>0)
    .filter(button=>button.scrollWidth>button.clientWidth+1||button.scrollHeight>button.clientHeight+1)
    .map(button=>button.textContent));
   expect(overflowing).toEqual([]);
  }
  await expect(output).toContainText('ESP32 deploy fixture');
 } finally {
  await app.evaluate(({app})=>app.exit(0));
  if(app.process().exitCode===null&&app.process().signalCode===null) {
   await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));
  }
  await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});

test('Studio switches to Python and runs the edited program beside the editor',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-python-simulator-'));
 const env=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));
 delete env.ELECTRON_RUN_AS_NODE;
 env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();
  await expect(page.locator('#launch-screen')).toHaveCount(0);
  await page.locator('main>header>label>select').selectOption('en');
  await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();
  const layouts=page.getByLabel('Editor layout');
  await layouts.getByRole('button',{name:'Code',exact:true}).click();
  const language=page.getByRole('group',{name:'Code language'});
  await expect(language.getByRole('button',{name:'C++',exact:true})).toHaveAttribute('aria-pressed','true');
  await language.getByRole('button',{name:'C++',exact:true}).click();
  const editor=page.locator('.studio .monaco-editor');
  const replace=async(text:string)=>{
   await editor.locator('textarea').focus();
   await page.keyboard.press('Control+A');
   await page.keyboard.insertText(text);
  };
  const cpp='void setup() {}\nvoid loop() {}';
  await replace(cpp);
  await language.getByRole('button',{name:'Python',exact:true}).click();
  const source='from jective_robot import drive, wait_ms, time_ms\ndrive(60, 60)\nwait_ms(400)\nprint(time_ms())';
  await replace(source);
  await expect(editor).toHaveAttribute('data-source',source);
  await page.getByRole('button',{name:'Run Python in simulator',exact:true}).click();
  const simulation=page.locator('.studio .simulator-embedded');
  await expect(simulation.getByLabel('Robot world, measured in metres')).toBeVisible();
  await expect(simulation.locator('.simulation-python-output')).toHaveText('400');
  const position=simulation.getByLabel('Simulation readings').getByText('Position',{exact:true}).locator('..').locator('strong');
  await expect.poll(async()=>Number((await position.textContent())?.split(',')[0])).toBeGreaterThan(0.5);
  await expect(simulation.getByLabel('Game checks').getByText('Passed').first()).toBeVisible();
  await language.getByRole('button',{name:'C++',exact:true}).click();
  await expect(editor).toHaveAttribute('data-source',cpp);
  await language.getByRole('button',{name:'Python',exact:true}).click();
  await expect(editor).toHaveAttribute('data-source',source);
  await layouts.getByRole('button',{name:'Blocks',exact:true}).click();
  await expect(language).toHaveCount(0);
  await layouts.getByRole('button',{name:'Code',exact:true}).click();
  await expect(language.getByRole('button',{name:'Python',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(editor).toHaveAttribute('data-source',source);
 }finally{
  await app.evaluate(({app})=>app.exit(0));
  if(app.process().exitCode===null&&app.process().signalCode===null){
   await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));
  }
  await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
