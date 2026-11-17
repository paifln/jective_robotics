import {parkVerificationWindow} from './helpers/window';
import {runIndicatorExperiment} from './helpers/simulation';
import {prepareProgrammingWorkspace,startLessonProject} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {decodeArchive} from '../../packages/persistence/archives';
test('L06 reference exports and reimports an actual portable timer project',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-mini-project-'));const path=join(root,'timer.jective.zip');const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  let approveImport=true;const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);page.on('dialog',dialog=>approveImport?dialog.accept():dialog.dismiss());await expect(page.locator('.monaco-editor').first()).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L06 ·/}).click();await startLessonProject(page,true);
  await expect(page.getByLabel('Project name',{exact:true})).toHaveValue('L06 · My experiment');await expect(page.locator('.monaco-editor').first()).toHaveAttribute('data-source',new RegExp('BREAK'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await app.evaluate(({dialog},file)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:file});dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},path);
  await page.locator('main>nav').getByRole('button',{name:'My projects',exact:true}).click();await page.getByText('Projects and tools',{exact:true}).click();await page.getByRole('button',{name:'Export portable project',exact:true}).click();
  await expect.poll(async()=>{try{return (await readFile(path)).length;}catch{return 0;}}).toBeGreaterThan(0);
  const archive=decodeArchive(await readFile(path));expect(archive.kind).toBe('project');if(archive.kind!=='project')throw new Error('Wrong archive');expect(archive.value.lessonId).toBe('L06');expect(archive.value.source).toContain('delay(600)');expect(archive.value.source).toContain('delay(400)');expect(archive.value.source).toContain('digitalWrite(2, LOW)');
  await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await page.getByLabel('Project name',{exact:true}).fill('Unsaved replacement');await page.locator('main>nav').getByRole('button',{name:'My projects',exact:true}).click();approveImport=false;await page.getByRole('button',{name:'Import portable project',exact:true}).click();await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await expect(page.getByLabel('Project name',{exact:true})).toHaveValue('Unsaved replacement');await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',/BREAK/);await page.locator('main>nav').getByRole('button',{name:'My projects',exact:true}).click();approveImport=true;await page.getByRole('button',{name:'Import portable project',exact:true}).click();await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await expect(page.getByLabel('Project name',{exact:true})).toHaveValue('L06 · My experiment');
  await runIndicatorExperiment(page);await expect(page.locator('.output')).toContainText('0.6 s | led channel 1: false');
 }finally{await app.evaluate(({app})=>app.exit(0));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
