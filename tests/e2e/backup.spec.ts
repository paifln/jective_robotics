import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,stat,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('actual backup restore preserves named snapshot metadata and retains the previous workspace backup',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-backup-bridge-'));const backupPath=join(root,'export.sqlite');
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>{win.setFocusable(false);win.setPosition(-12000,-12000);win.webContents.setBackgroundThrottling(false);win.on('show',()=>win.setPosition(-12000,-12000));win.showInactive();}));
  const page=await app.firstWindow();await expect(page.locator('#launch-screen')).toHaveCount(0);
  await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});dialog.showMessageBox=async()=>({response:1,checkboxChecked:false});},backupPath);
  const initial=await page.evaluate(async()=>{
   const project={schemaVersion:1 as const,id:crypto.randomUUID(),name:'Backup evidence project',profileId:'esp32-devkit-reference' as const,mode:'code' as const,source:'void setup(){}\nvoid loop(){}',workspace:{},revision:7};
   const saved=await window.jective.autosave(project);if(!saved.ok)throw new Error(saved.error.message);
   const snap=await window.jective.snapshotSave(project,'Before measured change');if(!snap.ok)throw new Error(snap.error.message);
   const snapshots=await window.jective.snapshots(project.id);const state=await window.jective.workspace();if(!snapshots.ok||!state.ok)throw new Error('Fixture state failed');
   const backed=await window.jective.backup();if(!backed.ok||!backed.value)throw new Error('Backup failed');
   await window.jective.snapshotSave(project,'After backup, must disappear on restore');
   return {project,snapshots:snapshots.value,recent:state.value.recent.find(p=>p.id===project.id)};
  });
  // Hold the native file dialog to exercise the asynchronous operation boundary.
  await app.evaluate(({dialog})=>{dialog.showOpenDialog=()=>new Promise(resolve=>{(globalThis as unknown as {releaseRestoreDialog:()=>void}).releaseRestoreDialog=()=>resolve({canceled:true,filePaths:[]});});});
  const pendingRestore=page.evaluate(()=>window.jective.restore());
  await expect.poll(()=>app.evaluate(()=>typeof (globalThis as unknown as {releaseRestoreDialog?:unknown}).releaseRestoreDialog==='function')).toBe(true);
  const blocked=await page.evaluate(async project=>({save:await window.jective.autosave({...project,name:'Must not change restored workspace'}),secondRestore:await window.jective.restore()}),initial.project);
  expect(blocked.save.ok?null:blocked.save.error.code).toBe('WORKSPACE_BUSY');expect(blocked.secondRestore.ok?null:blocked.secondRestore.error.code).toBe('WORKSPACE_BUSY');
  await app.evaluate(()=>{(globalThis as unknown as {releaseRestoreDialog:()=>void}).releaseRestoreDialog();});expect(await pendingRestore).toEqual({ok:true,value:false});
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},backupPath);
  // An outstanding save dialog must also prevent restoration from starting.
  await app.evaluate(({dialog})=>{dialog.showSaveDialog=()=>new Promise(resolve=>{(globalThis as unknown as {releaseSaveDialog:()=>void}).releaseSaveDialog=()=>resolve({canceled:true,filePath:''});});});
  const pendingSave=page.evaluate(project=>window.jective.save(project),initial.project);
  await expect.poll(()=>app.evaluate(()=>typeof (globalThis as unknown as {releaseSaveDialog?:unknown}).releaseSaveDialog==='function')).toBe(true);
  const busyRestore=await page.evaluate(()=>window.jective.restore());expect(busyRestore.ok?null:busyRestore.error.code).toBe('WORKSPACE_BUSY');
  await app.evaluate(()=>{(globalThis as unknown as {releaseSaveDialog:()=>void}).releaseSaveDialog();});const cancelledSave=await pendingSave;expect(cancelledSave.ok?null:cancelledSave.error.code).toBe('SAVE_CANCELLED');
  const oldFile=join(root,'old-document.jective.json');await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},oldFile);
  expect((await page.evaluate(project=>window.jective.save(project),initial.project)).ok).toBe(true);const oldBytes=await readFile(oldFile,'utf8');
  expect(await page.evaluate(()=>window.jective.restore())).toEqual({ok:true,value:true});
  const restored=await page.evaluate(async id=>({snapshots:await window.jective.snapshots(id),state:await window.jective.workspace()}),initial.project.id);
  expect(restored.snapshots.ok&&restored.snapshots.value).toEqual(initial.snapshots);
  expect(restored.state.ok&&restored.state.value.recent.find(p=>p.id===initial.project.id)).toEqual(initial.recent);
  expect((await stat(join(root,'workspace.sqlite.before-restore.sqlite'))).size).toBeGreaterThan(0);
  const newFile=join(root,'restored-document.jective.json');await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},newFile);
  expect((await page.evaluate(project=>window.jective.save({...project,source:'void setup(){}\nvoid loop(){ /* restored edit */ }'}),initial.project)).ok).toBe(true);
  expect(await readFile(oldFile,'utf8')).toBe(oldBytes);expect(await readFile(newFile,'utf8')).toContain('restored edit');
 }finally{await app.evaluate(({app})=>app.exit(0));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
