import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile,mkdir} from 'node:fs/promises';
import {join,resolve,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {CollisionReportSchema} from '../../packages/content/collision-report';
test('registered L45 exposes theory, real scenarios, checked answers and complete export',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-collision-lesson-')),output=join(root,'report.json');
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.webContents.setBackgroundThrottling(false);w.setPosition(-12000,-12000);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));await expect(page.locator('#launch-screen')).toHaveCount(0);
  await page.getByLabel('Язык',{exact:true}).selectOption('en');await page.locator('.content>.toolbar').getByRole('button',{name:'Programming',exact:true}).click();await page.getByRole('button',{name:'L45 · Test the places where a robot can fail',exact:true}).click();
  await expect(page.locator('.content')).toContainText('A robot program can work in an empty room');const panel=page.locator('.collision-lab');await panel.getByRole('button',{name:'Run scenario tests',exact:true}).click();await expect(panel.locator('tbody tr')).toHaveCount(3);await expect(panel.locator('tbody tr').first().locator('td')).toHaveText(['Yes','No']);
  await app.evaluate(({session},path)=>session.defaultSession.once('will-download',(_e,item)=>item.setSavePath(path)),output);await panel.getByRole('button',{name:'Export complete traces'}).click();await expect.poll(async()=>{try{return CollisionReportSchema.parse(JSON.parse(await readFile(output,'utf8'))).cases.wall.starter.trace.length;}catch{return 0;}}).toBe(300);
  for(const [i,value] of ['unchecked','clearance','validity','geometry'].entries())await panel.locator('.learning-option select').nth(i).selectOption(value);await panel.getByRole('button',{name:'Check',exact:true}).click();await expect.poll(async()=>{const r=await page.evaluate(()=>window.jective.learningLoad('L45'));return r.ok?r.value?.state:null;}).toBe('checked');
  await page.setViewportSize({width:800,height:700});await panel.locator('table').evaluate(el=>el.scrollIntoView({block:'center'}));expect(await panel.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);await mkdir('test-results/collision-lesson',{recursive:true});await page.screenshot({path:'test-results/collision-lesson/light.png'});
  await page.getByRole('button',{name:'Color theme',exact:true}).click();await expect(page.getByLabel('Language',{exact:true})).toHaveCSS('background-color','rgb(34, 48, 71)');await page.screenshot({path:'test-results/collision-lesson/dark.png'});
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-collision-lesson-'))throw new Error('Unexpected cleanup path');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
