import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {randomUUID} from 'node:crypto';
import {multiFileExample} from '../../packages/content/multifile-example';
import {expectReadableControl} from './theme-contrast';

test('Studio keeps commands and usable code space at laptop and narrow viewport sizes',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-density-')),file=join(root,'project.json');
 await writeFile(file,JSON.stringify({schemaVersion:1,id:randomUUID(),name:'Code workspace',profileId:'esp32-devkit-reference',mode:'code',...multiFileExample,workspace:{},revision:0}));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));env.JECTIVE_WORKSPACE_ROOT=root;delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow,dialog},file)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[file]});BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.setPosition(-12000,-12000);w.webContents.setBackgroundThrottling(false);w.showInactive();});},file);
  await expect(page.locator('#launch-screen')).toHaveCount(0);page.on('dialog',dialog=>dialog.accept());await page.locator('main>header>label>select').selectOption('en');
  await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await page.getByRole('button',{name:'Open project',exact:true}).click();
  const editor=page.locator('.studio .monaco-editor');await expect(editor).toHaveAttribute('data-file','sketch.ino');await expect(editor).toHaveAttribute('data-source',multiFileExample.source);await expect(page.locator('.code-files [role=tab]')).toHaveCount(4);
  const management=page.locator('.code-files details'),summary=management.locator('summary');await summary.focus();await page.keyboard.press('Enter');await expect(management).toHaveAttribute('open','');await expect(management.getByRole('textbox',{name:'New file name',exact:true})).toBeVisible();await summary.focus();await page.keyboard.press('Enter');await expect(management).not.toHaveAttribute('open');
  const metrics:unknown[]=[];await mkdir('test-results/studio-density',{recursive:true});
  for(const [width,height] of [[1366,768],[1093,614],[911,512],[800,700],[480,700]] as const){
   await page.setViewportSize({width,height});
   for(const locale of ['en','ru','kk'] as const){
    await page.locator('main>header>label>select').selectOption(locale);await page.evaluate(()=>scrollTo(0,0));
    const data=await page.evaluate(()=>{
     const toolbar=document.querySelector('.studio-toolbar')!.getBoundingClientRect(),editor=document.querySelector('.studio .monaco-editor')!.getBoundingClientRect();
     const nav=document.querySelector('main>nav')!.getBoundingClientRect(),bottom=nav.top>innerHeight/2?nav.top:innerHeight;
     return {toolbarHeight:toolbar.height,editorTop:editor.top,visibleCodeHeight:Math.max(0,Math.min(editor.bottom,bottom)-Math.max(editor.top,0)),overflow:document.documentElement.scrollWidth>innerWidth};
    });metrics.push({width,height,locale,...data});await writeFile('test-results/studio-density/metrics.json',JSON.stringify(metrics,null,2));
    expect(data.overflow).toBe(false);
    await expect(page.locator('.board-run-launch')).toBeVisible();await expect(page.locator('.studio-actions .action-button')).toHaveCount(4);
    if(width===800){expect(data.toolbarHeight).toBeLessThanOrEqual(110);expect(data.visibleCodeHeight).toBeGreaterThanOrEqual(220);}
    await page.locator('.board-run-launch').focus();await expect(page.locator('.board-run-launch')).toBeFocused();
    if(width===800&&locale==='en')await page.screenshot({path:'test-results/studio-density/code-800-light.png'});
   }
  }
  await page.setViewportSize({width:800,height:700});await page.locator('main>header>label>select').selectOption('en');
  const command=page.locator('.studio-actions .action-button').first();await expectReadableControl(command);
  await page.getByRole('button',{name:'Color theme',exact:true}).click();await expect(page.locator('body')).toHaveAttribute('data-theme','dark');await expectReadableControl(command);
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-results/studio-density/code-800-dark.png'});
  await writeFile('test-results/studio-density/metrics.json',JSON.stringify(metrics,null,2));
 }finally{
  await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-density-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
