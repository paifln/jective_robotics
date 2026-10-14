import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('reading a workspace project preserves the saved file binding; opening explicitly resets it',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-read-binding-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((x):x is [string,string]=>x[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await expect(page.locator('#launch-screen')).toHaveCount(0);const path=join(root,'bound.json');
  await app.evaluate(({dialog},path)=>{let calls=0;Object.assign(globalThis,{__saveCalls:()=>calls});dialog.showSaveDialog=async()=>++calls===1?{canceled:false,filePath:path}:{canceled:true,filePath:''};},path);
  const result=await page.evaluate(async()=>{
   const initial=await window.jective.save({schemaVersion:1,id:crypto.randomUUID(),name:'Bound file',profileId:'esp32-devkit-reference',mode:'code',source:'void setup(){}\nvoid loop(){}',workspace:{},revision:0});if(!initial.ok)throw Error(initial.error.message);
   const read=await window.jective.workspaceProject(initial.value.id);if(!read.ok||!read.value)throw Error('READ_FAILED');
   const saved=await window.jective.save({...initial.value,source:initial.value.source+'\n// edit after read'});if(!saved.ok)throw Error(saved.error.message);
   const opened=await window.jective.workspaceOpenProject(saved.value.id);if(!opened.ok||!opened.value)throw Error('OPEN_FAILED');
   const afterOpen=await window.jective.save(saved.value);return {saved:saved.value,afterOpen};
  });
  expect(result.saved.revision).toBe(2);expect(JSON.parse(await readFile(path,'utf8')).source).toContain('// edit after read');expect(result.afterOpen.ok).toBe(false);expect(result.afterOpen.ok?null:result.afterOpen.error.code).toBe('SAVE_CANCELLED');expect(await app.evaluate(()=> (globalThis as typeof globalThis&{__saveCalls:()=>number}).__saveCalls())).toBe(2);
 }finally{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
