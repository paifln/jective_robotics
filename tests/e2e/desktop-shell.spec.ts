import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {join,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';

test('Windows chrome and a retained floating assistant leave the workspace usable',async()=>{
 test.setTimeout(90000);
 const root=await mkdtemp(join(tmpdir(),'jective-window-shell-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;delete env.JECTIVE_ASSISTANT_TOKEN;delete env.JECTIVE_ASSISTANT_SERVER;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await app.evaluate(({BrowserWindow})=>{const window=BrowserWindow.getAllWindows()[0]!;window.setFocusable(false);window.setPosition(-12000,-12000);window.webContents.setBackgroundThrottling(false);window.showInactive();});
  await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('main>header>label>select').selectOption('en');
  await expect(page.getByRole('button',{name:'Close window',exact:true})).toBeVisible();
  await page.setViewportSize({width:1366,height:768});
  const header=page.locator('main>.window-chrome'),nav=page.locator('main>nav.student-navigation');
  await expect(header).toHaveCSS('height','48px');
  await expect(nav).toHaveCSS('top','48px');
  await expect(header.getByLabel('Language',{exact:true})).toBeInViewport();
  const native=await app.evaluate(({BrowserWindow})=>{const window=BrowserWindow.getAllWindows()[0]!;return {menu:window.isMenuBarVisible(),bounds:window.getBounds()};});expect(native.menu).toBe(false);
  await expect(page.locator('main>nav button[data-section]')).toHaveCount(6);
  await page.getByRole('button',{name:'Ask for help',exact:true}).click();const chat=page.getByRole('dialog',{name:'JECTIVE assistant',exact:true});await expect(chat).toBeVisible();await expect(chat).toHaveAttribute('aria-modal','false');
  await chat.getByLabel('Question',{exact:true}).fill('Keep this question while I work');
  await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await expect(page.locator('.studio')).toBeVisible();await expect(chat).toBeVisible();
  await chat.getByRole('button',{name:'Minimize chat',exact:true}).click();await expect(chat).toBeHidden();await expect(page.getByRole('button',{name:'Ask for help',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Ask for help',exact:true}).click();await expect(chat.getByLabel('Question',{exact:true})).toHaveValue('Keep this question while I work');await page.keyboard.press('Escape');await expect(chat).toBeHidden();
  await expect(page.locator('.studio .blocklySvg').first()).toBeVisible();
  await mkdir('test-results/desktop-shell',{recursive:true});
  await page.screenshot({path:'test-results/desktop-shell/studio-light.png',animations:'disabled'});
  await page.getByRole('button',{name:'Color theme',exact:true}).click();await expect(page.locator('body')).toHaveAttribute('data-theme','dark');
  await page.getByRole('button',{name:'Ask for help',exact:true}).click();await page.screenshot({path:'test-results/desktop-shell/chat-dark.png',animations:'disabled'});
  for(const [width,height] of [[1000,700],[800,700],[480,700]] as const){await page.setViewportSize({width,height});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect.poll(()=>chat.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);const bounds=await chat.boundingBox();expect(bounds).toBeTruthy();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.y).toBeGreaterThanOrEqual(36);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(height);await expect(page.getByRole('button',{name:'Close window',exact:true})).toBeInViewport();}
  await page.setViewportSize({width:1366,height:768});await chat.getByRole('button',{name:'Minimize chat',exact:true}).click();
  await page.getByRole('button',{name:'Maximize window',exact:true}).click();await expect.poll(()=>app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0]!.isMaximized())).toBe(true);await expect(page.getByRole('button',{name:'Restore window',exact:true})).toBeVisible();await page.getByRole('button',{name:'Restore window',exact:true}).click();await expect.poll(()=>app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0]!.isMaximized())).toBe(false);
  await page.getByRole('button',{name:'Minimize window',exact:true}).click();await expect.poll(()=>app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0]!.isMinimized())).toBe(true);await app.evaluate(({BrowserWindow})=>{const window=BrowserWindow.getAllWindows()[0]!;window.restore();window.setPosition(-12000,-12000);});
  await expect(page.locator('html')).toHaveAttribute('data-window-hidden','false');expect(errors).toEqual([]);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app.process().once('exit',()=>resolve()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-window-shell-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
