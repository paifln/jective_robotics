import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parkVerificationWindow} from './helpers/window';

test('file management rejects reserved build-control headers and preserves ordinary headers',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-source-file-safety-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));
 for(const key of ['ELECTRON_RUN_AS_NODE','OPENAI_API_KEY','ASSISTANT_MASTER_KEY','JECTIVE_ASSISTANT_SERVER','JECTIVE_ASSISTANT_TOKEN'])delete env[key];
 env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);page.on('dialog',dialog=>dialog.accept());
  await expect(page.locator('#launch-screen')).toHaveCount(0,{timeout:20000});await page.locator('main>header>label>select').selectOption('en');
  await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await page.locator('.student-settings>summary').click();await page.getByRole('button',{name:'Convert to Code',exact:true}).click();await page.getByRole('button',{name:'Blocks + code',exact:true}).click();
  const files=page.locator('.code-files');
  await files.getByLabel('Manage files',{exact:true}).click();
  const input=files.getByLabel('New file name',{exact:true}),add=files.getByRole('button',{name:'Add file',exact:true});
  for(const name of ['build_opt.h','BUILD_OPT.h','Build_Opt.h']){
   await input.fill(name);await add.click();await expect(files.getByRole('status')).toContainText('reserved for build settings');
   await expect(files.getByRole('tab')).toHaveCount(1);
  }
  await input.fill('build_options.h');await add.click();await expect(files.getByRole('tab',{name:'build_options.h',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(files.getByRole('tab')).toHaveCount(2);await expect(files.getByRole('status')).toBeEmpty();
  await expect.poll(async()=>{const result=await page.evaluate(()=>window.jective.workspace());return result.ok?Object.keys(result.value.recovery?.sourceFiles??{}):[];},{timeout:15000}).toEqual(['build_options.h']);
 }finally{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
