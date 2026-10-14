import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test,expect,_electron as electron} from '@playwright/test';
import {resolve} from 'node:path';
test('actual compiler from Electron UI accepts valid source and rejects invalid source',async()=>{
 test.setTimeout(360000);
 test.skip(process.env.JECTIVE_REAL_COMPILER!=='1','Real compiler requires explicitly installed pinned ESP32 toolchain');
 const workspaceRoot=await mkdtemp(join(tmpdir(),'jective-e2e-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));env.JECTIVE_TOOLCHAIN_ROOT=resolve('.toolchain/workspace');env.JECTIVE_WORKSPACE_ROOT=workspaceRoot;delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{const page=await app.firstWindow();await expect(page.getByRole('button',{name:'Compile',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Compile',exact:true}).click();await expect(page.locator('.output')).toContainText('State: succeeded',{timeout:180000});
 page.on('dialog',d=>d.accept());await page.getByRole('button',{name:'Convert to Code',exact:true}).click();await expect(page.getByText('Blocks • preserved original')).toBeVisible();const textbox=page.locator('.monaco-editor textarea');await textbox.focus();await page.keyboard.press('Control+A');await page.keyboard.type('void setup(){this_is_a_deliberate_compile_error;}\nvoid loop(){}');await expect(page.locator('.monaco-editor')).toHaveAttribute('data-source',new RegExp('this_is_a_deliberate_compile_error'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));await page.getByRole('button',{name:'Compile',exact:true}).click();await expect(page.locator('.output')).toContainText('State: failed',{timeout:180000});await expect(page.locator('.output')).toContainText('this_is_a_deliberate_compile_error');
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));await rm(workspaceRoot,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
