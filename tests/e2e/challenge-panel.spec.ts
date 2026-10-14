import {test,expect,_electron as electron} from '@playwright/test';
import {build} from 'esbuild';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {join,resolve,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
test('isolated challenge panel evaluates declared rules and rejects an untouched shuffled answer',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-challenge-panel-')),name='challenge-panel-test-'+randomUUID()+'.js',fixture=resolve('dist/renderer',name);
 const bundle=await build({stdin:{contents:"import React from 'react';import {createRoot} from 'react-dom/client';import {ChallengeTestPanel} from './apps/desktop/renderer/ChallengeTestPanel';document.querySelector('#root').hidden=true;const node=document.createElement('div');node.id='challenge-test-root';document.body.append(node);createRoot(node).render(<ChallengeTestPanel locale='ru'/>);",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'browser',format:'esm',write:false});await writeFile(fixture,bundle.outputFiles[0]!.contents,{flag:'wx'});
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.webContents.setBackgroundThrottling(false);w.setPosition(-12000,-12000);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));await expect(page.locator('#launch-screen')).toHaveCount(0);
  await page.evaluate(name=>import(new URL('./'+name,location.href).href),name);
  const panel=page.locator('.challenge-test-lab'),run=panel.getByRole('button',{name:'Проверить обе программы',exact:true});await run.click();await expect(panel.locator('tbody tr')).toHaveCount(2);await expect(panel.locator('tbody tr').first().locator('td').first()).toHaveText('Зачёт');await expect(panel.locator('tbody tr').last().locator('td').first()).toHaveText('Не зачтено');
  await panel.getByLabel('Срок, мс',{exact:true}).fill('20');await expect(panel.locator('table')).toHaveCount(0);await run.click();for(const row of await panel.locator('tbody tr').all())await expect(row.locator('td').first()).toHaveText('Не зачтено');
  await panel.getByLabel('Требовать достижения цели',{exact:true}).uncheck();await run.click();for(const row of await panel.locator('tbody tr').all())await expect(row.locator('td').first()).toHaveText('Зачёт');
  await panel.getByLabel('Срок, мс',{exact:true}).fill('21');await run.click();await expect(panel.getByRole('alert')).toBeVisible();await expect(panel.locator('table')).toHaveCount(0);
  await panel.getByRole('button',{name:'Проверить',exact:true}).click();await expect.poll(async()=>{const r=await page.evaluate(()=>window.jective.learningLoad('L47'));return r.ok?r.value?.state:null;}).toBe('needs-practice');
  await page.setViewportSize({width:480,height:800});expect(await panel.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);

 }finally{
  await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));
  if(!fixture.startsWith(resolve('dist/renderer')+sep)||!basename(fixture).startsWith('challenge-panel-test-'))throw new Error('Unexpected fixture cleanup path');await rm(fixture,{force:true});
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-challenge-panel-'))throw new Error('Unexpected workspace cleanup path');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});

