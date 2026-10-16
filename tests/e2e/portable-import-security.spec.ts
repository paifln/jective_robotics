import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {randomUUID} from 'node:crypto';
import {zipSync,strToU8} from 'fflate';
import type {Project} from '../../packages/contracts';
import {encodeArchive} from '../../packages/persistence/archives';
import {parkVerificationWindow} from './helpers/window';
import {prepareProgrammingWorkspace} from './helpers/learning';

test('rejected portable imports preserve current work and show localized feedback outside Studio',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-portable-security-')),saved=join(root,'Original project.json');
 const project:Project={schemaVersion:1,id:randomUUID(),name:'Imported project',profileId:'esp32-devkit-reference',mode:'code',source:'void setup(){}\nvoid loop(){}',workspace:{},revision:0};
 const valid=join(root,'valid.jective');await writeFile(valid,encodeArchive('project',project));
 const invalidBlocks=join(root,'invalid-blocks.jective'),invalidProject={...project,mode:'blocks' as const,workspace:{blocks:{languageVersion:0,blocks:[{type:'unknown_untrusted_block'}]}}};await writeFile(invalidBlocks,encodeArchive('project',invalidProject));
 const invalidJsonProject=join(root,'invalid-blocks.json');await writeFile(invalidJsonProject,JSON.stringify(invalidProject));
 const damaged=join(root,'damaged.jective'),bytes=Buffer.from(encodeArchive('project',project));bytes.writeUInt32LE(0,14);await writeFile(damaged,bytes);
 const forged=join(root,'forged-size.jective'),forgedBytes=Buffer.from(zipSync({'manifest.json':strToU8(JSON.stringify({format:'jective',version:1,kind:'project'})),'content.json':strToU8(JSON.stringify(project)+' '.repeat(4*1024*1024))}));
 const directory=forgedBytes.readUInt32LE(forgedBytes.length-6),second=directory+46+13,offset=forgedBytes.readUInt32LE(second+42);forgedBytes.writeUInt32LE(1,offset+22);forgedBytes.writeUInt32LE(1,second+24);await writeFile(forged,forgedBytes);
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=join(root,'workspace');
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();page.on('dialog',dialog=>void dialog.accept());const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);
  await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},saved);
  await page.getByLabel('Project name',{exact:true}).fill('Preserved original');await page.getByRole('button',{name:'Save project',exact:true}).click();await expect(page.locator('.output')).toContainText('Saved revision 1');
  const source=await page.locator('.studio .monaco-editor').getAttribute('data-source'),original=await readFile(saved,'utf8'),originalProject=JSON.parse(original);
  await page.locator('main>nav').getByRole('button',{name:'My projects',exact:true}).click();await page.locator('.project-tools>summary').click();
  const unsolicited=await page.evaluate(candidate=>window.jective.acceptProjectOpen(candidate),project);expect(!unsolicited.ok&&unsolicited.error.code).toBe('PROJECT_OPEN_STALE');
  const translations=[['en','Import portable project','damaged','Dismiss message','blocks in this project'],['ru','Импорт проекта','повреждён','Скрыть сообщение','блоки этого проекта'],['kk','Жобаны импорттау','бүлінген','Хабарды жасыру','жобаның блоктарын']] as const;
  for(const [locale,button,fragment,dismiss,blockFragment]of translations){
   await page.locator('main>header>label>select').selectOption(locale);
   for(const path of [damaged,forged,invalidBlocks]){
    await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},path);
    await page.getByRole('button',{name:button,exact:true}).click();
    const notice=page.locator('.operation-notice');await expect(notice).toBeVisible();await expect(notice).toContainText(path===invalidBlocks?blockFragment:fragment);await expect(notice).not.toContainText(root);
    const recovery=await page.evaluate(()=>window.jective.workspace());expect(recovery.ok&&recovery.value.recovery?.id).toBe(originalProject.id);expect(await readFile(saved,'utf8')).toBe(original);await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',source!);
    await notice.getByRole('button',{name:dismiss,exact:true}).click();await expect(notice).toHaveCount(0);
   }
  }
  await page.locator('main>header>label>select').selectOption('en');await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();
  await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});dialog.showSaveDialog=async()=>{throw new Error('EXISTING_BINDING_MUST_BE_RETAINED');};},invalidJsonProject);
  await page.getByRole('button',{name:'Open project',exact:true}).click();await expect(page.locator('.output')).toContainText('blocks in this project');await expect(page.getByLabel('Project name',{exact:true})).toHaveValue('Preserved original');await page.getByRole('button',{name:'Save project',exact:true}).click();await expect(page.locator('.output')).toContainText('Saved revision 2');expect(JSON.parse(await readFile(saved,'utf8')).source).toBe(originalProject.source);expect(await readFile(invalidJsonProject,'utf8')).toBe(JSON.stringify(invalidProject));
  const projects=await page.evaluate(()=>window.jective.projectList({query:'',offset:0,limit:50}));expect(projects.ok&&projects.value.items.some(item=>item.id===project.id)).toBe(false);
  await page.locator('main>nav').getByRole('button',{name:'My projects',exact:true}).click();await app.evaluate(({dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});},valid);
  await page.getByRole('button',{name:'Import portable project',exact:true}).click();await expect(page.locator('.operation-notice')).toHaveCount(0);
  await expect.poll(async()=>{const result=await page.evaluate(()=>window.jective.workspace());return result.ok?result.value.recovery?.id:null;}).toBe(project.id);
  await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await expect(page.getByLabel('Project name',{exact:true})).toHaveValue('Imported project');expect(errors).toEqual([]);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-portable-security-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
