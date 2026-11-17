import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('desktop surfaces remain usable in both themes and compact windows',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-design-review-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((item):item is [string,string]=>item[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>{win.setFocusable(false);win.setPosition(-12000,-12000);win.webContents.setBackgroundThrottling(false);win.on('show',()=>win.setPosition(-12000,-12000));win.showInactive();}));
  const page=await app.firstWindow();await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('header>label>select').selectOption('en');await mkdir('test-results/design-review',{recursive:true});
  await page.setViewportSize({width:1366,height:900});
  for(const theme of ['light','dark']){
   if(await page.locator('body').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'Color theme',exact:true}).click();
   for(const section of ['Learn','My projects','Simulator','Serial Monitor','Studio']){
    await page.locator('main>nav').getByRole('button',{name:section,exact:true}).click();
    if(section==='Studio'){
     await page.getByRole('button',{name:'Blocks + code',exact:true}).click();
     const editor=await page.locator('.studio .layout').boundingBox();expect(editor!.height).toBeGreaterThan(350);
     await expect(page.locator('.studio-actions').getByRole('button',{name:'Save project',exact:true})).toBeVisible();
     expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+4)).toBe(true);
    }
    await page.screenshot({path:`test-results/design-review/${section.replaceAll(' ','-')}-${theme}.png`,animations:'disabled'});
   }
  }
  const menu=page.getByRole('button',{name:'Toggle menu',exact:true});await menu.click();await expect(menu).toHaveAttribute('title','Expand menu');await expect(page.locator('main')).toHaveClass(/rail-collapsed/);await expect(page.locator('main>nav .rail-text').first()).toBeVisible();
  await page.locator('main>nav').getByRole('button',{name:'Learn',exact:true}).click();await expect(page.getByRole('heading',{name:'Learn and try',exact:true})).toBeVisible();await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await menu.click();await expect(menu).toHaveAttribute('title','Collapse menu');
  const compile=page.locator('.studio-actions').getByRole('button',{name:'Compile — check code for the board',exact:true});await compile.hover();const tip=compile.getByRole('tooltip');await expect(tip).toBeVisible();const tipBounds=await tip.boundingBox();expect(tipBounds!.x).toBeGreaterThanOrEqual(0);expect(tipBounds!.x+tipBounds!.width).toBeLessThanOrEqual(1366);await menu.hover();
  const normal=await page.locator('.studio>.layout').boundingBox();await page.getByRole('button',{name:'Expand editor',exact:true}).click();const expanded=await page.locator('.studio>.layout').boundingBox();expect(expanded!.height).toBeGreaterThan(normal!.height+60);await expect(page.locator('.studio>.components-dock')).toBeHidden();await page.getByRole('button',{name:'Expand editor',exact:true}).click();await expect(page.locator('.studio>.components-dock')).toBeVisible();
  await page.setViewportSize({width:800,height:700});await page.screenshot({path:'test-results/design-review/Studio-800.png',animations:'disabled'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+4)).toBe(true);
  await expect(page.locator('.studio .blocklySvg')).toHaveCSS('background-color','rgb(25, 28, 34)');
  await expect(page.locator('.studio>.trace-tools>summary')).toBeVisible();
  for(const [locale,label] of [['ru','Компилировать — проверить код для платы'],['kk','Компиляция — тақша кодын тексеру']] as const){
   await page.locator('header>label>select').selectOption(locale);const command=page.locator('.studio-actions').getByRole('button',{name:label,exact:true});await command.hover();const localizedTip=command.getByRole('tooltip');await expect(localizedTip).toBeVisible();await expect(localizedTip).toHaveText(label);const box=await localizedTip.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(800);expect(box!.y+box!.height).toBeLessThanOrEqual(638);
  }
 }finally{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
