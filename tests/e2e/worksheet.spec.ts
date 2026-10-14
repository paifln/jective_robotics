import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('component worksheet exports actual entered evidence without inventing specifications',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-worksheet-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 let app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await expect(page.locator('.monaco-editor').first()).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await page.getByRole('button',{name:'Learn',exact:true}).click();
  await page.getByRole('button',{name:/^L02 ·/}).click();
  await expect(page.getByRole('button',{name:'Load starter',exact:true})).toHaveCount(0);
  await page.locator('summary').filter({hasText:/^Controller$/}).click();
  await page.getByLabel('Controller — Actual visible marking',{exact:true}).fill('Unknown revision; photographed with power off');
  await page.getByLabel('Controller — Unresolved questions',{exact:true}).fill('Need manufacturer schematic before connecting motor power');
  const destination=join(root,'worksheet.json');
  await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},destination);
  await page.getByRole('button',{name:'Export completed worksheet JSON',exact:true}).click();
  await expect.poll(async()=>{try{return JSON.parse(await readFile(destination,'utf8')).worksheetId;}catch{return null;}}).toBe('L02-component-role-and-power-path');
  const payload=JSON.parse(await readFile(destination,'utf8'));
  expect(payload.worksheetId).toBe('L02-component-role-and-power-path');
  expect(payload.values['controller.marking']).toBe('Unknown revision; photographed with power off');
  expect(payload.values['controller.unknown']).toContain('manufacturer schematic');
  expect(payload.values['controller.documented']).toBeUndefined();
  expect(payload.verification).toContain('teacher review');
  await page.getByRole('button',{name:'Studio',exact:true}).click();await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L02 ·/}).click();await page.locator('summary').filter({hasText:/^Controller$/}).click();
  await expect(page.getByLabel('Controller — Unresolved questions',{exact:true})).toHaveValue('Need manufacturer schematic before connecting motor power');
  await expect.poll(async()=>{const state=await page.evaluate(()=>window.jective.workspace());return state.ok?state.value.recovery?.worksheets?.['L02-component-role-and-power-path']?.['controller.marking']:null;}).toBe('Unknown revision; photographed with power off');
  await app.evaluate(({app})=>app.exit(0));app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});const recoveredPage=await app.firstWindow();recoveredPage.on('dialog',dialog=>dialog.accept());
  await expect(recoveredPage.locator('.monaco-editor').first()).toHaveAttribute('data-source',/digitalWrite/);await recoveredPage.getByRole('button',{name:'Learn',exact:true}).click();await recoveredPage.getByRole('button',{name:/^L02 ·/}).click();await recoveredPage.locator('summary').filter({hasText:/^Controller$/}).click();
  await expect(recoveredPage.getByLabel('Controller — Actual visible marking',{exact:true})).toHaveValue('Unknown revision; photographed with power off');
 }finally{await app.evaluate(({app})=>app.exit(0));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
