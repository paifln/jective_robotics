import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';

test('project versions save and restore through real persistence; repeated clicks and rejected IPC recover',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-project-actions-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.setPosition(-12000,-12000);w.webContents.setBackgroundThrottling(false);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));
  await page.locator('main>header>label>select').selectOption('en');
  const seeded=await page.evaluate(async()=>{
   const project={schemaVersion:1 as const,id:crypto.randomUUID(),name:'Version practice',profileId:'esp32-devkit-reference',mode:'code' as const,source:'void setup(){}\nvoid loop(){}\n// original version',workspace:{},revision:0};
   const result=await window.jective.autosave(project);return {project,result};
  });expect(seeded.result.ok).toBe(true);
  const nav=page.locator('main>nav'),panel=page.locator('.student-projects');await nav.getByRole('button',{name:'My projects',exact:true}).click();
  const card=panel.locator('.project-cards>article').filter({has:page.getByRole('heading',{name:'Version practice',exact:true})});await expect(card.locator('time')).toHaveAttribute('datetime',/^\d{4}-\d{2}-\d{2}T/);
  await card.getByRole('button',{name:'Open project',exact:true}).click();await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',seeded.project.source);
  await nav.getByRole('button',{name:'My projects',exact:true}).click();await panel.getByText('Saved versions of the current project',{exact:true}).click();
  const name=panel.getByLabel('Version name',{exact:true}),save=panel.getByRole('button',{name:'Save version',exact:true});await name.fill('Before experiment');await save.click();
  await expect(panel).toContainText('Version saved');const versions=await page.evaluate(id=>window.jective.snapshots(id),seeded.project.id);expect(versions.ok&&versions.value.filter(v=>v.label==='Before experiment')).toHaveLength(1);
  const version=panel.locator('details>article').filter({hasText:'Before experiment'});await version.getByRole('button',{name:'Open a restored copy',exact:true}).click();
  await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',seeded.project.source);
  await expect.poll(async()=>{const r=await page.evaluate(()=>window.jective.workspace());return r.ok?r.value.recovery?.id:null;}).not.toBe(seeded.project.id);
  const original=await page.evaluate(id=>window.jective.workspaceProject(id),seeded.project.id);expect(original.ok&&original.value?.source).toBe(seeded.project.source);
  await nav.getByRole('button',{name:'My projects',exact:true}).click();await panel.getByText('Saved versions of the current project',{exact:true}).click();await name.fill('Retry this version');
  // Explicit delayed malformed response tests the real preload rejection and UI lock.
  await app.evaluate(({ipcMain})=>{
   const state=globalThis as typeof globalThis&{snapshotCalls:number;releaseSnapshot?:()=>void};state.snapshotCalls=0;
   ipcMain.removeHandler('workspace:snapshot');ipcMain.handle('workspace:snapshot',()=>{state.snapshotCalls++;return new Promise(resolve=>{state.releaseSnapshot=()=>resolve({ok:true,value:'INVALID TEST RESPONSE'});});});
  });
  await save.evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click();});await expect(save).toBeDisabled();await expect(name).toBeDisabled();
  await expect.poll(()=>app.evaluate(()=>(globalThis as typeof globalThis&{snapshotCalls:number}).snapshotCalls)).toBe(1);
  await app.evaluate(()=>{(globalThis as typeof globalThis&{releaseSnapshot?:()=>void}).releaseSnapshot?.();});
  await expect(panel.getByRole('status').last()).toContainText('Could not complete this action');await expect(save).toBeEnabled();await expect(name).toHaveValue('Retry this version');expect(errors).toEqual([]);
  // A departed browser must not apply its late result or drag the learner back.
  await app.evaluate(({ipcMain},project)=>{
   const state=globalThis as typeof globalThis&{openCalls:number;releaseOpen?:()=>void};state.openCalls=0;
   ipcMain.removeHandler('workspace:openProject');ipcMain.handle('workspace:openProject',()=>{state.openCalls++;return new Promise(resolve=>{state.releaseOpen=()=>resolve({ok:true,value:project});});});
  },seeded.project);
  await panel.locator('.project-cards>article').first().getByRole('button',{name:'Open project',exact:true}).click();
  await expect.poll(()=>app.evaluate(()=>(globalThis as typeof globalThis&{openCalls:number}).openCalls)).toBe(1);
  await nav.getByRole('button',{name:'Learn',exact:true}).click();await app.evaluate(()=>{(globalThis as typeof globalThis&{releaseOpen?:()=>void}).releaseOpen?.();});
  // Drain the delivered IPC result through the same renderer event loop.
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  await expect(nav.getByRole('button',{name:'Learn',exact:true})).toHaveAttribute('aria-pressed','true');await expect(panel).toHaveCount(0);expect(errors).toEqual([]);
 }finally{
  if(app.process().exitCode===null&&app.process().signalCode===null)await app.evaluate(({app})=>app.exit(0)).catch(()=>{});
  if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-project-actions-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
