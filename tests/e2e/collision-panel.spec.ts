import {test,expect,_electron as electron} from '@playwright/test';
import {build} from 'esbuild';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {join,resolve,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
test('isolated collision learner panel runs real worker and checks explanations at narrow width',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-collision-panel-')),name='collision-panel-test-'+randomUUID()+'.js',fixture=resolve('dist/renderer',name);
 const bundle=await build({stdin:{contents:"import React from 'react';import {createRoot} from 'react-dom/client';import {CollisionPanel} from './apps/desktop/renderer/CollisionPanel';document.querySelector('#root').hidden=true;const node=document.createElement('div');node.id='collision-test-root';document.body.append(node);createRoot(node).render(<CollisionPanel locale='ru'/>);",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'browser',format:'esm',write:false});await writeFile(fixture,bundle.outputFiles[0]!.contents,{flag:'wx'});
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.webContents.setBackgroundThrottling(false);w.setPosition(-12000,-12000);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));await expect(page.locator('#launch-screen')).toHaveCount(0);
  await page.evaluate(name=>import(new URL('./'+name,location.href).href),name);
  const panel=page.locator('.collision-lab');await expect(panel.getByRole('heading',{name:'Найди причину отказа до движения робота'})).toBeVisible();await panel.getByRole('button',{name:'Запустить тесты сценариев',exact:true}).click();await expect(panel.locator('tbody tr')).toHaveCount(3);
  await expect(panel.locator('tbody tr').nth(0).locator('td')).toHaveText(['Да','Нет']);await expect(panel.locator('tbody tr').nth(1).locator('td')).toHaveText(['Да','Нет']);await expect(panel).toContainText('Недопустимый старт отклонён: Да');await expect(panel.getByRole('button',{name:'Скачать полные трассы'})).toBeVisible();
  const selects=panel.locator('.learning-option select');for(const [i,value] of ['unchecked','clearance','validity','geometry'].entries())await selects.nth(i).selectOption(value);
  await panel.getByRole('button',{name:'Проверить',exact:true}).click();await expect.poll(async()=>{const r=await page.evaluate(()=>window.jective.learningLoad('L45'));return r.ok?r.value?.state:null;}).toBe('checked');
  await page.setViewportSize({width:480,height:800});expect(await panel.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
 }finally{
  await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));
  if(!fixture.startsWith(resolve('dist/renderer')+sep)||!basename(fixture).startsWith('collision-panel-test-'))throw new Error('Unexpected fixture cleanup path');await rm(fixture,{force:true});
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-collision-panel-'))throw new Error('Unexpected workspace cleanup path');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});

