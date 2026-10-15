import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {englishWorkspace} from './helpers/learning';
import {parkVerificationWindow} from './helpers/window';

test('code font zoom supports keyboard and wheel without changing the source, activity or native window scale',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-code-reading-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await englishWorkspace(page);
  await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await page.locator('.view-switch').getByRole('button',{name:'Code',exact:true}).click();
  const editor=page.locator('.studio .monaco-editor'),input=editor.locator('textarea'),lines=editor.locator('.view-lines');await expect(editor).toBeVisible();
  const source=await editor.getAttribute('data-source');expect(source?.length).toBeGreaterThan(0);
  const font=()=>lines.evaluate(element=>parseFloat(getComputedStyle(element).fontSize));const baseline=await font();await input.focus();
  await page.keyboard.press('Control+=');await expect.poll(font).toBeGreaterThan(baseline);await page.keyboard.press('Control+-');await expect.poll(font).toBe(baseline);
  await page.keyboard.press('Control+Shift+=');await expect.poll(font).toBeGreaterThan(baseline);await page.keyboard.press('Control+0');await expect.poll(font).toBe(baseline);
  await lines.hover();await page.keyboard.down('Control');try{await page.mouse.wheel(0,-120);}finally{await page.keyboard.up('Control');}await expect.poll(font).toBeGreaterThan(baseline);
  await input.focus();await page.keyboard.press('Control+0');await expect.poll(font).toBe(baseline);await expect(editor).toHaveAttribute('data-source',source!);
  expect(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0]!.webContents.getZoomFactor())).toBe(1);expect(await page.evaluate(()=>window.jective.activity())).toEqual({ok:true,value:{}});
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-code-reading-'))throw Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
