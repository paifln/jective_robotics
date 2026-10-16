import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve,relative,isAbsolute,basename} from 'node:path';
import {test,expect} from '@playwright/test';
import {launchCompilerDesktop} from './helpers/compiler-desktop';

test('actual compiler from the learner UI accepts valid source, rejects invalid source and preserves recovery',async({},testInfo)=>{
 test.setTimeout(1320000);
 test.skip(process.env.JECTIVE_REAL_COMPILER!=='1','Explicitly opt in with an installed pinned SDK; no installation or hardware calls');
 const root=await mkdtemp(join(tmpdir(),'jective-real-compiler-Учебный профиль ')),toolchain=resolve(process.env.JECTIVE_TOOLCHAIN_ROOT??'.toolchain/workspace');
 let desktop:Awaited<ReturnType<typeof launchCompilerDesktop>>|undefined;
 const report={scope:'Actual UI and pinned compiler with an isolated profile. No upload, serial port opening, provider request or installer.',builds:[] as {state:string;operationId:string;elapsedMs:number;artifacts:string[];progressSamples:string[];artifactBytes:number;sourceVerified:true;environment:{sha256:string;files:number;bytes:number};stages:{stage:string;at:number}[]}[],recovery:false};
 try{
  desktop=await launchCompilerDesktop(root,toolchain,process.env.JECTIVE_EXECUTABLE);let page=desktop.page;
  const prepare=async()=>{await expect(page.locator('#launch-screen')).toHaveCount(0,{timeout:20000});await page.locator('main>header>label>select').selectOption('en');await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();};
  await prepare();await page.locator('.student-settings>summary').click();await page.getByLabel('Board',{exact:true}).selectOption('esp32-devkit-reference');
  await page.getByRole('button',{name:'Convert to Code',exact:true}).click();await page.getByRole('button',{name:'Blocks + code',exact:true}).click();
  const editor=page.locator('.studio .monaco-editor');
  const source=async(text:string)=>{await editor.locator('textarea').focus();await page.keyboard.press('Control+A');await page.keyboard.insertText(text);await expect(editor).toHaveAttribute('data-source',text);};
  const build=async(state:'succeeded'|'failed',budget:number)=>{
   const input=await editor.getAttribute('data-source');expect(input).not.toBeNull();
   await page.evaluate(()=>{const state=window as typeof window&{__compilerUiStages:{stage:string;at:number}[];__compilerUiUnsubscribe?:()=>void};state.__compilerUiUnsubscribe?.();state.__compilerUiStages=[];state.__compilerUiUnsubscribe=window.jective.onBuildStage(event=>{if(state.__compilerUiStages.at(-1)?.stage!==event.stage)state.__compilerUiStages.push({stage:event.stage,at:Date.now()});});});
   const started=Date.now();await page.locator('.studio-actions').getByRole('button',{name:'Compile — check code for the board',exact:true}).click();
   const output=page.locator('.output>pre'),progressSamples:string[]=[];while(Date.now()-started<budget){const text=await output.textContent();if(text?.includes('State: '+state))break;if(/BUILD_ENVIRONMENT_CHANGED|ENVIRONMENT_WORKER_TIMEOUT/.test(text??'')||(state==='succeeded'&&/State: (failed|interrupted)/.test(text??'')))throw new Error('REAL_COMPILER_CHECK_FAILED: '+text);const progress=(await page.locator('.build-integrity-progress').allTextContents()).join('');if(progress&&progress!==progressSamples.at(-1)&&progressSamples.length<20)progressSamples.push(progress);await new Promise(done=>setTimeout(done,500));}
   await expect(output).toContainText('State: '+state);
   const operationId=await page.locator('.compiler-journal').getAttribute('data-operation-id');expect(operationId).toMatch(/^[a-f0-9-]{36}$/);
   const manifest=JSON.parse(await readFile(join(toolchain,'builds',operationId!,'manifest.json'),'utf8'));
   expect(manifest.state).toBe(state);expect(manifest.exitCode).toBe(state==='succeeded'?0:1);
   if(state==='succeeded')expect(manifest.artifacts).toEqual(expect.arrayContaining(['sketch.ino.bin','sketch.ino.elf']));else{expect(manifest.artifacts).toEqual([]);await expect(output).toContainText('deliberate_compile_error');}
   const sourceBytes=await readFile(join(toolchain,'builds',operationId!,'sketch','sketch.ino'));expect(sourceBytes.toString('utf8')).toBe(input);expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(manifest.sourceFileHashes['sketch.ino']);
   let artifactBytes=0;for(const name of manifest.artifacts){expect(name).toMatch(/^[a-zA-Z0-9_.-]+\.(bin|elf)$/);const hash=createHash('sha256');let bytes=0;for await(const chunk of createReadStream(join(toolchain,'builds',operationId!,'output',name))){hash.update(chunk);bytes+=chunk.length;}expect(hash.digest('hex')).toBe(manifest.artifactHashes[name]);expect(bytes).toBe(manifest.artifactSizes[name]);artifactBytes+=bytes;}
   expect(manifest.environment).toMatchObject({scope:'cli-selected-core-installed-tools-user-libraries-v2',sha256:expect.stringMatching(/^[a-f0-9]{64}$/),files:expect.any(Number),bytes:expect.any(Number)});
   expect(progressSamples.some(value=>value.includes('Files checked:'))).toBe(true);await expect(page.locator('.build-integrity-progress')).toHaveAttribute('aria-live','off');
   const stages=await page.evaluate(()=>(window as typeof window&{__compilerUiStages:{stage:string;at:number}[]}).__compilerUiStages);expect(stages.map(value=>value.stage)).toEqual(state==='succeeded'?['toolchain','environment-before','compile','environment-after','artifacts']:['toolchain','environment-before','compile','artifacts']);
   report.builds.push({state,operationId:operationId!,elapsedMs:Date.now()-started,artifacts:manifest.artifacts,progressSamples,artifactBytes,sourceVerified:true,environment:{sha256:manifest.environment.sha256,files:manifest.environment.files,bytes:manifest.environment.bytes},stages});
  };
  const good='#include <Arduino.h>\nvoid setup(){}\nvoid loop(){}\n';
  await source(good);await build('succeeded',810000);
  await source('#include <Arduino.h>\nvoid setup(){deliberate_compile_error;}\nvoid loop(){}\n');await build('failed',480000);
  await source(good);await expect.poll(async()=>{const value=await page.evaluate(()=>window.jective.workspace());return value.ok?value.value.recovery?.source:null;},{timeout:15000}).toBe(good);
  await desktop.stop();desktop=await launchCompilerDesktop(root,toolchain,process.env.JECTIVE_EXECUTABLE);page=desktop.page;await prepare();await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',good);report.recovery=true;
  await writeFile(testInfo.outputPath('actual-compiler.json'),JSON.stringify(report,null,2));
 }finally{
  await writeFile(testInfo.outputPath('actual-compiler.json'),JSON.stringify(report,null,2));
  await desktop?.stop();const guard=relative(resolve(tmpdir()),resolve(root));if(!guard||guard.startsWith('..')||isAbsolute(guard)||!basename(root).startsWith('jective-real-compiler-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
