import {parkVerificationWindow} from './helpers/window';
import {prepareProgrammingWorkspace,startLessonProject} from './helpers/learning';
import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('square calibration exports actual repeated traces and requires a learner rationale',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-square-ui-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));
 delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await prepareProgrammingWorkspace(page,true,true);await expect(page.getByRole('button',{name:'Learn',exact:true})).toBeVisible();await expect(page.locator('#launch-screen')).toHaveCount(0);
  page.on('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L24 ·/}).click();
  const panel=page.locator('.square-route-panel');await panel.locator('summary').click();
  await panel.getByRole('button',{name:'Compare square routes',exact:true}).click();await expect(panel.getByRole('alert')).toContainText('at least 10');await expect(panel.locator('tbody tr')).toHaveCount(0);
  await panel.getByLabel('Revision explanation',{exact:true}).fill('Increase turn time to correct the observed under-turn.');
  await panel.getByRole('button',{name:'Compare square routes',exact:true}).click();await expect(panel.locator('table').first().locator('tbody tr')).toHaveCount(3);
  const pathBounds=await panel.locator('polyline').evaluateAll(elements=>elements.map(element=>{const box=(element as SVGGraphicsElement).getBBox();return {x:box.x,y:box.y,right:box.x+box.width,bottom:box.y+box.height};}));
  expect(pathBounds.every(box=>box.x>=24&&box.y>=24&&box.right<=456&&box.bottom<=276)).toBe(true);
  const file=join(root,'square.json');await app.evaluate(({session},path)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(path));},file);
  await panel.getByRole('button',{name:'Export square comparison JSON',exact:true}).click();
  await expect.poll(async()=>{try{return JSON.parse(await readFile(file,'utf8')).lessonId;}catch{return '';}}).toBe('L24');
  const report=JSON.parse(await readFile(file,'utf8'));
  expect(report.revision.summary.meanEndpointErrorMeters).toBeLessThan(report.baseline.summary.meanEndpointErrorMeters);
  expect(report.revision.rows[0].trace.at(-1).status).toBe('completed');expect(report.revision.rows[0].sides).toHaveLength(4);await expect(panel.locator('.square-sides tbody tr')).toHaveCount(4);expect(report.revision.physicalVerification).toBe('NOT RUN');expect(report.justification).toContain('under-turn');
  await panel.getByLabel('Revised turn (ms)',{exact:true}).fill('');await expect(panel.locator('tbody tr')).toHaveCount(0);
  await panel.getByRole('button',{name:'Compare square routes',exact:true}).click();await expect(panel.getByRole('alert')).toBeVisible();await expect(panel.getByRole('button',{name:'Export square comparison JSON',exact:true})).toHaveCount(0);
  for(const reference of [false,true]){
   await startLessonProject(page,reference?true:false);
   await expect(page.getByLabel('Project name')).toHaveValue('L24 · My experiment');
   await page.getByRole('button',{name:'Simulator',exact:true}).click();
   await expect(page.getByLabel('World',{exact:true})).toHaveValue('L24-square-calibration');
   await page.getByRole('button',{name:'Run',exact:true}).click();
   await expect(page.locator('.simulator-workspace pre')).toContainText('"status": "completed"',{timeout:20000});
   const state=JSON.parse((await page.locator('.simulator-workspace pre').textContent())!);
   const expected=reference?report.revision:report.baseline;
   expect(state.pose.x).toBeCloseTo(expected.rows[0].trace.at(-1).pose.x,10);
   expect(state.pose.y).toBeCloseTo(expected.rows[0].trace.at(-1).pose.y,10);
   expect(state.pose.heading).toBeCloseTo(expected.rows[0].trace.at(-1).pose.heading,10);
   await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('button',{name:/^L24 ·/}).click();
  }
 }finally{
  await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));
  await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});
 }
});
