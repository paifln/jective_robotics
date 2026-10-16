import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {parkVerificationWindow} from './helpers/window';
test('partial learner provisioning removes secret environment values before normal app operation',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-provisioning-env-')),env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;delete env.JECTIVE_ASSISTANT_SERVER;env.JECTIVE_WORKSPACE_ROOT=root;env.JECTIVE_ASSISTANT_TOKEN='jt_'+'t'.repeat(43);env.OPENAI_API_KEY='EXPLICIT_PROVIDER_FIXTURE';env.ASSISTANT_MASTER_KEY='EXPLICIT_MASTER_FIXTURE';
 const app=await electron.launch({args:['.'],env});
 try{const page=await app.firstWindow();await parkVerificationWindow(app);await expect(page.locator('#launch-screen')).toHaveCount(0,{timeout:20000});
  expect(await app.evaluate(()=>({learner:Object.hasOwn(process.env,'JECTIVE_ASSISTANT_TOKEN'),provider:Object.hasOwn(process.env,'OPENAI_API_KEY'),master:Object.hasOwn(process.env,'ASSISTANT_MASTER_KEY')}))).toEqual({learner:false,provider:false,master:false});
  const settings=await page.evaluate(()=>window.jective.assistantSettings());expect(settings.ok&&settings.value.keyConfigured).toBe(false);
  await expect.poll(async()=>{try{return await readFile(join(root,'logs','operations.jsonl'),'utf8');}catch{return '';}}).toContain('PROVISION_INCOMPLETE');const log=await readFile(join(root,'logs','operations.jsonl'),'utf8');expect(log).not.toContain(env.JECTIVE_ASSISTANT_TOKEN);expect(log).not.toContain('EXPLICIT_PROVIDER_FIXTURE');expect(log).not.toContain('EXPLICIT_MASTER_FIXTURE');
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-provisioning-env-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
