import {openSimulationTools} from './helpers/simulation';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';

test('visual scene adjustments preserve the lesson model, reject invalid geometry and save timed input without JSON',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-scene-controls-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((item):item is [string,string]=>item[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>{win.setFocusable(false);win.setPosition(-12000,-12000);win.webContents.setBackgroundThrottling(false);win.on('show',()=>win.setPosition(-12000,-12000));win.showInactive();}));
  const page=await app.firstWindow();await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('header>label>select').selectOption('en');
  await page.locator('.content>.toolbar').getByRole('button',{name:'Programming',exact:true}).click();await page.getByRole('button',{name:/^L28 ·/}).click();await page.getByRole('button',{name:'Start the task in Studio',exact:true}).click();
  await page.locator('main>nav').getByRole('button',{name:'Simulator',exact:true}).click();const controls=page.locator('.scene-controls');await openSimulationTools(page,'Edit field');
  const readWorld=()=>page.evaluate(async()=>{const result=await window.jective.workspace();if(!result.ok)throw new Error('WORKSPACE_UNAVAILABLE');return result.value.recovery?.simulationWorld;});
  await controls.getByRole('button',{name:'Apply area changes',exact:true}).click();await expect.poll(readWorld).toBeTruthy();const original=(await readWorld())!;
  await controls.getByLabel('Robot y, m',{exact:true}).fill('0.988');await controls.getByRole('button',{name:'Apply area changes',exact:true}).click();await expect.poll(async()=>(await readWorld())?.start.y).toBe(.988);
  const adjusted=(await readWorld())!;expect(adjusted.line).toEqual(original.line);expect(adjusted.robot).toEqual(original.robot);expect(adjusted.goal).toEqual(original.goal);expect(adjusted.analog).toEqual(original.analog);expect(adjusted.start.heading).toBe(original.start.heading);
  await controls.getByLabel('Robot y, m',{exact:true}).fill('-1');await controls.getByRole('button',{name:'Apply area changes',exact:true}).click();await expect(controls.getByRole('alert')).toBeVisible();expect((await readWorld())!.start.y).toBe(.988);
  await controls.getByText('Press a button during the run',{exact:true}).click();await controls.getByLabel('Press at, s',{exact:true}).fill('0.8');await controls.getByLabel('Release at, s',{exact:true}).fill('1');await controls.getByRole('button',{name:'Apply timed press',exact:true}).click();
  await expect.poll(async()=>(await readWorld())?.buttonEvents).toEqual([{timeMs:800,pressed:true},{timeMs:1000,pressed:false}]);expect((await readWorld())!.line).toEqual(original.line);await expect(page.getByLabel('Scenario JSON',{exact:true})).toHaveCount(0);
 }finally{
  await app.evaluate(({app})=>app.exit(0)).catch(()=>{});if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-scene-controls-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});
 }
});
