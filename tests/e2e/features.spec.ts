import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {englishWorkspace} from './helpers/learning';
import {openSimulationTools} from './helpers/simulation';
import {parkVerificationWindow} from './helpers/window';

test('offline student workspace, actual port enumeration, simulation and SQLite recovery are usable',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-features-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await englishWorkspace(page);const nav=page.locator('main>nav');await expect(nav.locator('button[data-section]')).toHaveCount(6);await expect(nav).not.toContainText('Classroom');
  await nav.getByRole('button',{name:'Studio',exact:true}).click();await expect(page.locator('.studio .monaco-editor')).toHaveAttribute('data-source',/digitalWrite/);
  await expect.poll(async()=>{const state=await page.evaluate(()=>window.jective.workspace());return state.ok?state.value.recovery?.source:'';}).toContain('digitalWrite');expect((await stat(join(root,'workspace.sqlite'))).size).toBeGreaterThan(0);
  await nav.getByRole('button',{name:'Simulator',exact:true}).click();await openSimulationTools(page);await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText('ready');await page.getByRole('button',{name:'Step 20 ms',exact:true}).click();await expect(page.locator('.simulator-workspace pre')).toContainText('"timeMs": 20');await page.getByLabel('World',{exact:true}).selectOption('maze');await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.getByLabel('Robot world, measured in metres',{exact:true})).toBeVisible();
  await nav.getByRole('button',{name:'Serial Monitor',exact:true}).click();await page.getByRole('button',{name:'Refresh ports',exact:true}).click();const ports=await page.evaluate(()=>window.jective.devices());expect(ports.ok).toBe(true);if(!ports.ok)throw new Error('PORT_ENUMERATION_FAILED');await expect(page.getByLabel('Port',{exact:true}).locator('option')).toHaveCount(ports.value.length+1);await expect(page.getByRole('heading',{name:'Serial Monitor',exact:true})).toBeVisible();await expect(page.locator('.serial-workspace').getByRole('button',{name:'Run on board',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Open monitor',exact:true})).toBeDisabled();expect(await page.evaluate(()=>window.jective.activity())).toEqual({ok:true,value:{}});
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
