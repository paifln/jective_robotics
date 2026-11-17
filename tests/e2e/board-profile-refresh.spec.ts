import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {profiles} from '../../packages/profiles';
import {encodeProfile} from '../../packages/profiles/exchange';
import {englishWorkspace} from './helpers/learning';
import {openComponentConnections,openStudioProgram} from './helpers/studio';
import {parkVerificationWindow} from './helpers/window';

test('import updates the current Studio board list, malformed replies recover and late lists cannot erase newer results',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-profile-refresh-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());await parkVerificationWindow(app);await englishWorkspace(page);await openComponentConnections(page);
  await page.getByText('Board definitions (advanced)',{exact:true}).click();await page.getByText('Board profile exchange',{exact:true}).click();const exchange=page.locator('.studio .connections details').filter({has:page.locator(':scope>summary').getByText('Board profile exchange',{exact:true})});
  const custom={...profiles[0]!,id:'custom-live-list',name:'Explicit profile import fixture',ledPin:4};await exchange.getByLabel('Profile JSON',{exact:true}).fill(encodeProfile(custom));await exchange.getByRole('button',{name:'Validate and import profile',exact:true}).click();await expect(exchange.locator('pre')).toHaveText('Profile imported');
  // The app remains in Studio throughout: no section-change refresh can hide a missing import event.
  await openStudioProgram(page);const settings=page.locator('.student-settings');await expect(settings).not.toHaveAttribute('open');const board=page.getByRole('combobox',{name:'Board',exact:true});await expect(board.locator(`option[value="${custom.id}@${custom.version}"]`)).toHaveCount(1);await board.selectOption(custom.id+'@'+custom.version);await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',/digitalWrite\(4, HIGH\)/);
  const name=page.getByRole('textbox',{name:'Project name',exact:true});
  await expect(name).toBeVisible();
  await name.fill('Board profile test project');
  await expect(page.locator('.workspace-heading h1')).toHaveText('Board profile test project');
  const workspace=page.locator('.studio .blocklySvg');
  await expect(workspace).toBeVisible();
  const workspaceHeight=await workspace.evaluate(node=>node.getBoundingClientRect().height);
  await settings.locator('summary').first().click();
  await expect(settings.getByText('Verification',{exact:true})).toBeVisible();
  expect(await workspace.evaluate(node=>node.getBoundingClientRect().height)).toBe(workspaceHeight);
  const valid=await page.evaluate(()=>window.jective.boardProfiles());if(!valid.ok)throw new Error('VALID_LIST_FIXTURE_UNAVAILABLE');
  await app.evaluate(({ipcMain})=>{ipcMain.removeHandler('profiles:list');ipcMain.handle('profiles:list',()=>({ok:true,value:[{id:'UNTRUSTED_PROFILE_PAYLOAD'}]}));});await page.evaluate(()=>window.dispatchEvent(new Event('jective-board-profiles-changed')));
  await expect(page.locator('.student-settings [role=alert]')).toContainText('Could not refresh the board list');await expect(page.locator('.student-settings')).not.toContainText('UNTRUSTED_PROFILE_PAYLOAD');await expect(board).toHaveValue(custom.id+'@'+custom.version);
  await app.evaluate(({ipcMain},value)=>{ipcMain.removeHandler('profiles:list');ipcMain.handle('profiles:list',()=>({ok:true,value}));},valid.value);await page.locator('.student-settings').getByRole('button',{name:'Try again',exact:true}).click();await expect(page.locator('.student-settings [role=alert]')).toHaveCount(0);
  await app.evaluate(({ipcMain},value)=>{let calls=0;ipcMain.removeHandler('profiles:list');ipcMain.handle('profiles:list',async()=>{if(++calls===1){await new Promise(done=>setTimeout(done,700));return {ok:true,value:value.filter(profile=>profile.id!=='custom-live-list')};}return {ok:true,value};});},valid.value);
  await page.evaluate(()=>{window.dispatchEvent(new Event('jective-board-profiles-changed'));window.dispatchEvent(new Event('jective-board-profiles-changed'));});await page.waitForTimeout(850);await expect(board.locator(`option[value="${custom.id}@${custom.version}"]`)).toHaveCount(1);await expect(board).toHaveValue(custom.id+'@'+custom.version);await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',/digitalWrite\(4, HIGH\)/);expect(errors).toEqual([]);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-profile-refresh-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
