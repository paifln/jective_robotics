import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('reading settings support keyboard focus, escape, dismissal and native 200 percent zoom',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-reading-keyboard-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((item):item is [string,string]=>item[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>{win.setFocusable(false);win.setPosition(-12000,-12000);win.setSize(1000,800);win.webContents.setBackgroundThrottling(false);win.on('show',()=>win.setPosition(-12000,-12000));win.showInactive();}));
  const page=await app.firstWindow();await expect(page.locator('#launch-screen')).toHaveCount(0);
  await page.locator('header>label>select').selectOption('en');
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>win.webContents.setZoomFactor(2)));
  expect(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0]!.webContents.getZoomFactor())).toBe(2);
  const button=page.getByRole('button',{name:'Reading settings',exact:true}),size=page.getByLabel('Text size',{exact:true});
  await button.focus();await page.keyboard.press('Enter');await expect(size).toBeFocused();await expect(size).toHaveCSS('outline-width','2px');await expect(size).toHaveCSS('outline-color','rgb(33, 29, 255)');
  const popover=page.locator('.reading-popover');await expect(popover).toHaveAttribute('id',await button.getAttribute('aria-controls')??'');
  await size.selectOption('24');await page.keyboard.press('Tab');const spacing=page.getByRole('checkbox',{name:'More line spacing',exact:true});await expect(spacing).toBeFocused();await page.keyboard.press('Space');await expect(spacing).toBeChecked();
  await popover.scrollIntoViewIfNeeded();const bounds=await popover.boundingBox();expect(bounds).not.toBeNull();const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(viewport.width+1);expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(viewport.height+1);
  const navigation=await page.locator('main>nav').boundingBox();expect(navigation).not.toBeNull();expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(navigation!.y);
  await page.keyboard.press('Tab');await page.keyboard.press('Tab');const speed=page.getByLabel('Playback speed',{exact:true});await expect(speed).toBeFocused();const speedBounds=await speed.boundingBox();expect(speedBounds!.y+speedBounds!.height).toBeLessThanOrEqual(bounds!.y+bounds!.height);
  const png=await app.evaluate(async({BrowserWindow})=>(await BrowserWindow.getAllWindows()[0]!.webContents.capturePage()).toPNG().toString('base64'));
  await writeFile('test-results/reading-native-200-percent.png',Buffer.from(png,'base64'));
  await page.keyboard.press('Escape');await expect(popover).toHaveCount(0);await expect(button).toBeFocused();await page.keyboard.press('Space');await expect(size).toBeFocused();
  await page.getByRole('button',{name:'Learn',exact:true}).focus();await expect(popover).toHaveCount(0);
  await page.locator('.library-layout>aside>button').nth(1).click();await expect(page.locator('.lesson-heading h3')).toBeFocused();
  await page.getByRole('button',{name:'Next lesson',exact:true}).click();await expect(page.locator('.lesson-heading h3')).toBeFocused();await expect(page.locator('.library-layout>aside>button').nth(2)).toHaveAttribute('aria-pressed','true');
 }finally{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
