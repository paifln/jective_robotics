import {test,expect,_electron as electron} from '@playwright/test';
import {build} from 'esbuild';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {join,resolve,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
test('manual measurement component rejects invalid input, describes missing samples and clears stale results',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-entered-measurements-')),name='entered-measurements-test-'+randomUUID()+'.js',fixture=resolve('dist/renderer',name);
 const bundle=await build({stdin:{contents:"import React from 'react';import {createRoot} from 'react-dom/client';import {EnteredMeasurements} from './apps/desktop/renderer/EnteredMeasurements';document.querySelector('#root').hidden=true;const node=document.createElement('div');document.body.append(node);createRoot(node).render(<EnteredMeasurements locale='ru'/>);",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'browser',format:'esm',write:false});await writeFile(fixture,bundle.outputFiles[0]!.contents,{flag:'wx'});
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.webContents.setBackgroundThrottling(false);w.setPosition(-12000,-12000);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));await expect(page.locator('#launch-screen')).toHaveCount(0);await page.evaluate(name=>import(new URL('./'+name,location.href).href),name);
  const panel=page.locator('.entered-measurements');await panel.locator('summary').click();const analyze=panel.getByRole('button',{name:'Разобрать введённые показания',exact:true});await analyze.click();await expect(panel.getByRole('alert')).toBeVisible();
  await panel.getByLabel('Опорное расстояние, м',{exact:true}).fill('1.5');await panel.locator('textarea').fill('1,4\n?\n1.6');await analyze.click();await expect(panel.locator('dd')).toHaveText(['2 / 1','1.5000','0.2000','0.0000']);await expect(panel.getByRole('button',{name:'Скачать введённые измерения'})).toBeVisible();
  await panel.locator('textarea').fill('?');await expect(panel.locator('dl')).toHaveCount(0);await expect(panel.getByRole('button',{name:'Скачать введённые измерения'})).toHaveCount(0);await analyze.click();await expect(panel.locator('dd')).toHaveText(['0 / 1','—','—','—']);
  await panel.locator('textarea').fill('1 cm');await analyze.click();await expect(panel.getByRole('alert')).toBeVisible();await expect(panel.locator('dl')).toHaveCount(0);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));if(!fixture.startsWith(resolve('dist/renderer')+sep)||!basename(fixture).startsWith('entered-measurements-test-'))throw new Error('Unexpected fixture cleanup');await rm(fixture,{force:true});if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-entered-measurements-'))throw new Error('Unexpected workspace cleanup');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
