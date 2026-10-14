import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('save and reopen Unicode project through bridge and actual filesystem',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'jective-ui-'));const path=join(folder,'Қазақша русский project.jective.json');
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));env.JECTIVE_WORKSPACE_ROOT=join(folder,'workspace');delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>{win.setFocusable(false);win.setPosition(-12000,-12000);win.webContents.setBackgroundThrottling(false);win.on('show',()=>win.setPosition(-12000,-12000));win.showInactive();}));const page=await app.firstWindow();page.on('dialog',dialog=>void dialog.accept());await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('header>label>select').selectOption('en');await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await page.locator('.student-settings>summary').click();const preview=page.locator('.monaco-editor');await expect(preview).toHaveAttribute('data-source',/void setup/);const originalSource=await preview.getAttribute('data-source');
 await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},path);
 await page.getByLabel('Project name').fill('Қазақша тест');await page.getByRole('button',{name:'Save project',exact:true}).click();await expect(page.locator('.output')).toContainText('Saved revision 1');
 const saved=JSON.parse(await readFile(path,'utf8'));expect(saved.name).toBe('Қазақша тест');expect(saved.source).toBe(originalSource);expect(saved.workspace.blocks.blocks).toHaveLength(2);
 const before=await readFile(path,'utf8');
 const rejected=await page.evaluate(original=>window.jective.save({...original,workspace:{explicitOversizeTestFixture:'x'.repeat(2000001)}}),saved);
 expect(rejected.ok).toBe(false);if(rejected.ok)throw new Error('Oversized fixture unexpectedly saved');expect(rejected.error.message).toContain('PROJECT_TOO_LARGE');expect(await readFile(path,'utf8')).toBe(before);
 await page.getByRole('button',{name:'Open project',exact:true}).click();await expect(page.getByLabel('Project name')).toHaveValue('Қазақша тест');await expect(preview).toHaveAttribute('data-source',originalSource!);
 const external=JSON.stringify({...saved,name:'External edit with unchanged revision'},null,2);await writeFile(path,external);
 await page.getByRole('button',{name:'Save project',exact:true}).click();await expect(page.locator('.output')).toContainText('This file changed outside the current project.');await expect(page.locator('.output')).toContainText('Keep your current work in a project copy');
 expect(await readFile(path,'utf8')).toBe(external);await expect(page.getByLabel('Project name')).toHaveValue('Қазақша тест');await expect(preview).toHaveAttribute('data-source',originalSource!);
 await page.locator('.output').scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>{const header=document.querySelector('main>header')!.getBoundingClientRect();return [120,240,360,480].every(x=>!!document.elementFromPoint(x,header.top+header.height/2)?.closest('header'));})).toBe(true);
 await page.screenshot({path:'test-results/project-studio-conflict.png',animations:'disabled'});
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(folder,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
