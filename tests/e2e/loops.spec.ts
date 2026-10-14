import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('L10 actual reference blocks finish bounded work and continue the event-loop trace',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-loops-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',d=>d.accept());await expect(page.locator('.monaco-editor').first()).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L10 ·/}).click();await page.getByRole('button',{name:'Load reference solution',exact:true}).click();await expect(page.getByLabel('Project name')).toHaveValue('L10 learner project');
  await page.getByRole('button',{name:'Simulate indicator trace',exact:true}).click();await expect(page.locator('.output')).toContainText('600 ms | print: DONE');await expect(page.locator('.output')).toContainText('700 ms | print: IDLE');
 }finally{await app.evaluate(({app})=>app.exit(0));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
