import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test, expect, _electron as electron} from '@playwright/test';
import {openArduinoTemplates} from './helpers/studio';

test('Python editor regenerates the board sketch and saves and reopens its source',async()=>{
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
  await expect(page.locator('#launch-screen')).toHaveCount(0);
  await page.locator('main>header>label>select').selectOption('en');
  const templates=await openArduinoTemplates(page);
  await templates.getByRole('button',{name:'New robot program (Python)',exact:true}).click();
  const editor=page.locator('.studio .monaco-editor');
  await expect(editor).toHaveAttribute('data-file','main.py');
  const compile=page.getByRole('button',{name:'Compile — check code for the board',exact:true});
  const cpp=page.getByRole('button',{name:'Generated Arduino C++',exact:true});
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
  await write('def loop():\n    import os');
  await expect(page.getByText('Check Python syntax on line 2')).toBeVisible();
  await expect(compile).toBeDisabled();
  await expect(cpp).toBeDisabled();
  const source='def loop():\n    led(True)\n    wait_ms(321)';
  await write(source);
  await expect(editor).toHaveAttribute('data-source',source);
  await expect(compile).toBeEnabled();
  await cpp.click();
  await expect(editor).toHaveAttribute('data-file','sketch.ino');
  await expect(editor).toHaveAttribute('data-source',/delay\(321\)/);
  await page.getByRole('button',{name:'Save project',exact:true}).click();
  await expect(page.locator('.output>pre')).toContainText('Saved revision');
  expect(JSON.parse(await readFile(path,'utf8')).pythonSource).toBe(source);
  await page.getByRole('button',{name:'Open project',exact:true}).click();
  await page.getByRole('button',{name:'main.py',exact:true}).click();
  await expect(editor).toHaveAttribute('data-source',source);
 } finally {
  await app.evaluate(({app})=>app.exit(0));
  if(app.process().exitCode===null&&app.process().signalCode===null) {
   await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));
  }
  await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
