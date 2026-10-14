import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {decodeArchive} from '../../packages/persistence/archives';
test('L06 reference exports and reimports an actual portable timer project',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-mini-project-'));const path=join(root,'timer.jective.zip');const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',dialog=>dialog.accept());await expect(page.locator('.monaco-editor').first()).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L06 ·/}).click();await page.getByRole('button',{name:'Load reference solution',exact:true}).click();
  await expect(page.getByLabel('Project name')).toHaveValue('L06 learner project');await expect(page.locator('.monaco-editor').first()).toHaveAttribute('data-source',new RegExp('BREAK'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},path);
  await page.getByText('Projects and tools',{exact:true}).click();await page.getByRole('button',{name:'Export portable project',exact:true}).click();
  await expect.poll(async()=>{try{return (await readFile(path)).length;}catch{return 0;}}).toBeGreaterThan(0);
  const archive=decodeArchive(await readFile(path));expect(archive.kind).toBe('project');if(archive.kind!=='project')throw new Error('Wrong archive');expect(archive.value.lessonId).toBe('L06');expect(archive.value.source).toContain('delay(600)');expect(archive.value.source).toContain('delay(400)');expect(archive.value.source).toContain('digitalWrite(2, LOW)');
  await page.getByLabel('Project name').fill('Unsaved replacement');await page.getByRole('button',{name:'Import portable project',exact:true}).click();await expect(page.getByLabel('Project name')).toHaveValue('L06 learner project');
  await page.getByRole('button',{name:'Simulate indicator trace',exact:true}).click();await expect(page.locator('.output')).toContainText('600 ms | led channel 1: false');
 }finally{await app.evaluate(({app})=>app.exit(0));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
