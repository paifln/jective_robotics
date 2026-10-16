import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,mkdir,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,resolve,sep,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {parkVerificationWindow} from './helpers/window';
import {englishWorkspace} from './helpers/learning';

test('tool imports require branded localized review, reserve the build lock and bind approval to the exact manifest',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-tool-review-')),source=join(root,'bundle'),relative='data/packages/esp32/hardware/esp32/3.3.12/platform.txt';
 const payload='EXPLICIT TEST FIXTURE, NOT A WORKING BUILD CORE',manifestPath=join(source,'jective-toolchain-manifest.json');await mkdir(dirname(join(source,relative)),{recursive:true});await writeFile(join(source,relative),payload);
 const manifest=JSON.stringify({format:'jective-toolchain',version:1,cli:'1.5.1',core:'esp32:esp32@3.3.12',files:[{path:relative,size:Buffer.byteLength(payload),sha256:createHash('sha256').update(payload).digest('hex')}]});await writeFile(manifestPath,manifest);
 const hash=createHash('sha256').update(manifest).digest('hex');
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=join(root,'workspace');env.JECTIVE_TOOLCHAIN_ROOT=join(root,'tools');
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',dialog=>void dialog.accept());await parkVerificationWindow(app);await englishWorkspace(page);await page.locator('main>nav').getByRole('button',{name:'My projects',exact:true}).click();await page.locator('.project-tools>summary').click();
  await app.evaluate(({dialog},source)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[source]});},source);
  for(const [locale,button,fragment]of [['en','Import offline toolchain folder','publisher signature'],['ru','Импорт офлайн-инструментов','не подтверждает издателя'],['kk','Офлайн құралдарды импорттау','қолтаңбасы емес']] as const){
   await page.locator('main>header>label>select').selectOption(locale);
   await app.evaluate(({dialog})=>{const state=globalThis as typeof globalThis&{review?:{message:string;detail:string;icon:boolean;defaultId:number|undefined;cancelId:number|undefined}};dialog.showMessageBox=async(...args:[Electron.MessageBoxOptions]|[Electron.BaseWindow,Electron.MessageBoxOptions])=>{const options=args.length===2?args[1]:args[0];state.review={message:options.message,detail:options.detail??'',icon:typeof options.icon==='object'&&!options.icon.isEmpty(),defaultId:options.defaultId,cancelId:options.cancelId};return {response:0,checkboxChecked:false};};});
   await page.getByRole('button',{name:button,exact:true}).click();
   await expect.poll(()=>app.evaluate(()=>Boolean((globalThis as typeof globalThis&{review?:unknown}).review))).toBe(true);
   const review=await app.evaluate(()=>(globalThis as typeof globalThis&{review: {message:string;detail:string;icon:boolean;defaultId:number;cancelId:number}}).review);expect(review.message).toContain(fragment);expect(review.detail).toContain(hash);expect(review.icon).toBe(true);expect(review.defaultId).toBe(0);expect(review.cancelId).toBe(0);expect(await readdir(root)).toEqual(['bundle','workspace']);
   await app.evaluate(()=>{delete (globalThis as typeof globalThis&{review?:unknown}).review;});
  }
  await page.locator('main>header>label>select').selectOption('en');
  await app.evaluate(({dialog})=>{dialog.showMessageBox=async()=>new Promise(resolve=>{(globalThis as typeof globalThis&{releaseReview?:()=>void}).releaseReview=()=>resolve({response:1,checkboxChecked:false});});});
  await page.getByRole('button',{name:'Import offline toolchain folder',exact:true}).click();await expect.poll(()=>app.evaluate(()=>typeof(globalThis as typeof globalThis&{releaseReview?:unknown}).releaseReview)).toBe('function');
  const second=await page.evaluate(()=>window.jective.toolchainImport());expect(!second.ok&&second.error.code).toBe('TOOLCHAIN_BUSY');
  const status=await page.evaluate(()=>window.jective.toolchain());expect(!status.ok&&status.error.code).toBe('TOOLCHAIN_BUSY');
  await writeFile(manifestPath,manifest+'\n');await app.evaluate(()=>(globalThis as typeof globalThis&{releaseReview:()=>void}).releaseReview());
  await expect(page.locator('.operation-notice')).toBeVisible();await expect(page.locator('.operation-notice')).toContainText('changed after review');expect(await readdir(root)).toEqual(['bundle','workspace']);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-tool-review-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
