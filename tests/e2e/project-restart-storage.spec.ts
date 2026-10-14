import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('Unicode source, snapshots and file revision survive an actual Electron restart',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-project-restart-')),file=join(root,'Қазақша русский project.jective.json');
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((item):item is [string,string]=>item[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 let app=await electron.launch({args:['.'],env});
 const prepare=async()=>{
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>{win.setFocusable(false);win.setPosition(-12000,-12000);win.webContents.setBackgroundThrottling(false);win.on('show',()=>win.setPosition(-12000,-12000));win.showInactive();}));
  const page=await app.firstWindow();page.on('dialog',dialog=>void dialog.accept());await expect(page.locator('#launch-screen')).toHaveCount(0);await page.waitForTimeout(2300);return page;
 };
 const stop=async()=>{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));};
 try{
  let page=await prepare();await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);
  const saved=await page.evaluate(async()=>{
   const project={schemaVersion:1 as const,id:crypto.randomUUID(),name:'Қазақша робот — русский',profileId:'esp32-devkit-reference' as const,mode:'code' as const,source:'// Қазақша және русский\r\nvoid setup(){}\r\nvoid loop(){}\r\n',workspace:{},revision:0};
   const result=await window.jective.save(project);if(!result.ok)throw new Error(result.error.message);
   const snapshot=await window.jective.snapshotSave(result.value,'До изменений');if(!snapshot.ok)throw new Error(snapshot.error.message);
   return result.value;
  });expect(saved.revision).toBe(1);expect(JSON.parse(await readFile(file,'utf8')).source).toBe(saved.source);
  const versions=await page.evaluate(id=>window.jective.snapshots(id),saved.id);await stop();app=await electron.launch({args:['.'],env});page=await prepare();
  const recovered=await page.evaluate(()=>window.jective.workspace());expect(recovered.ok&&recovered.value.recovery).toEqual(saved);expect(await page.evaluate(id=>window.jective.snapshots(id),saved.id)).toEqual(versions);
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);
  expect(await page.evaluate(()=>window.jective.open())).toEqual({ok:true,value:saved});
  const updated=await page.evaluate(project=>window.jective.save({...project,source:project.source+'// новая версия\r\n'}),saved);expect(updated.ok&&updated.value.revision).toBe(2);expect(updated.ok&&JSON.parse(await readFile(file,'utf8')).source).toBe(updated.ok&&updated.value.source);
  if(!updated.ok)throw new Error(updated.error.message);
  const external={...updated.value,revision:updated.value.revision,source:updated.value.source+'// external editor fixture\r\n'};const externalBytes=JSON.stringify(external,null,2);await writeFile(file,externalBytes);
  const conflict=await page.evaluate(project=>window.jective.save({...project,source:project.source+'// unsaved local change\r\n'}),updated.value);expect(conflict.ok?null:conflict.error.code).toBe('PROJECT_CONFLICT');expect(await readFile(file,'utf8')).toBe(externalBytes);
 }finally{await stop().catch(()=>{});await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
