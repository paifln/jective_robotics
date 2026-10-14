import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('compact reading controls and automatic illustrations stop when not visible',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-visible-lesson-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((item):item is [string,string]=>item[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>{win.setFocusable(false);win.setPosition(-12000,-12000);win.webContents.setBackgroundThrottling(false);win.on('show',()=>win.setPosition(-12000,-12000));win.showInactive();}));
  const page=await app.firstWindow();await expect(page.locator('#launch-screen')).toHaveCount(0);await page.locator('header>label>select').selectOption('en');
  await expect(page.getByLabel('Text size',{exact:true})).toHaveCount(0);
  const listen=page.getByRole('button',{name:'Listen to lesson theory',exact:true});await expect(listen).toBeEnabled();await expect(listen).toHaveText('');
  await page.locator('.reading-tools audio').evaluate((element:HTMLAudioElement)=>{element.muted=true;});await listen.click();await expect(page.getByRole('button',{name:'Pause narration',exact:true})).toHaveAttribute('aria-pressed','true');
  const audio=await page.locator('.reading-tools audio').evaluate((element:HTMLAudioElement)=>({paused:element.paused,src:element.currentSrc}));expect(audio.paused).toBe(false);expect(audio.src).toContain('F01-en.ogg');await page.getByRole('button',{name:'Pause narration',exact:true}).click();
  const foundation=page.locator('.foundation-scene');await foundation.scrollIntoViewIfNeeded();await expect(foundation).toHaveAttribute('data-animation-state','running');await expect(foundation.locator('.foundation-rover')).toHaveCSS('animation-play-state','running');
  await page.getByRole('button',{name:'Reading settings',exact:true}).click();await page.getByLabel('Text size',{exact:true}).selectOption('24');await page.getByLabel('Reduce motion',{exact:true}).check();await expect(foundation).toHaveAttribute('data-animation-state','paused');await page.getByLabel('Reduce motion',{exact:true}).uncheck();await page.keyboard.press('Escape');await expect(page.getByLabel('Text size',{exact:true})).toHaveCount(0);
  await page.locator('.content>.toolbar').getByRole('button',{name:'Programming',exact:true}).click();await page.getByRole('button',{name:/^L03 ·/}).click();
  const figure=page.locator('.lesson-story>figure');await figure.scrollIntoViewIfNeeded();await expect(figure).toHaveAttribute('data-animation-state','running');await expect(page.getByRole('button',{name:'Play animation',exact:true})).toHaveCount(0);
  const first=await figure.getAttribute('data-frame');await expect.poll(()=>figure.getAttribute('data-frame')).not.toBe(first);
  await page.locator('.extra-guidance').scrollIntoViewIfNeeded();await expect(figure).toHaveAttribute('data-animation-state','paused');const stopped=await figure.getAttribute('data-frame');await page.waitForTimeout(250);expect(await figure.getAttribute('data-frame')).toBe(stopped);
  await figure.scrollIntoViewIfNeeded();await expect(figure).toHaveAttribute('data-animation-state','running');
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>{win.webContents.setBackgroundThrottling(true);win.minimize();}));await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.windowHidden==='true')).toBe(true);await expect(figure).toHaveAttribute('data-animation-state','paused');const hiddenFrame=await figure.getAttribute('data-frame');await page.waitForTimeout(250);expect(await figure.getAttribute('data-frame')).toBe(hiddenFrame);
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>{win.restore();win.setPosition(-12000,-12000);win.showInactive();}));await expect.poll(()=>page.evaluate(()=>document.hidden)).toBe(false);await expect(figure).toHaveAttribute('data-animation-state','running');
  await page.locator('main>nav').getByRole('button',{name:'Simulator',exact:true}).click();await expect(figure).toHaveAttribute('data-animation-state','paused');const away=await figure.getAttribute('data-frame');await page.waitForTimeout(250);expect(await figure.getAttribute('data-frame')).toBe(away);
  await page.locator('main>nav').getByRole('button',{name:'Learn',exact:true}).click();await figure.scrollIntoViewIfNeeded();await expect(figure).toHaveAttribute('data-animation-state','running');
  await page.setViewportSize({width:1000,height:800});await page.locator('.lesson-heading').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/lesson-compact-light.png',animations:'disabled'});await page.getByRole('button',{name:'Color theme',exact:true}).click();await page.screenshot({path:'test-results/lesson-compact-dark.png',animations:'disabled'});
  // Explicit rejected-play fixture: an old lesson must not set the new lesson's error.
  await page.evaluate(()=>{const original=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=()=>new Promise<void>((_resolve,reject)=>{(window as unknown as {rejectOldPlay:()=>void}).rejectOldPlay=()=>{HTMLMediaElement.prototype.play=original;reject(new Error('OLD_LESSON_PLAY_FIXTURE'));};});});
  await page.getByRole('button',{name:'Listen to lesson theory',exact:true}).click();await page.getByRole('button',{name:/^L04 ·/}).click();await expect(page.locator('.reading-tools audio')).toHaveAttribute('src','learning/audio/L04-en.ogg');
  await page.evaluate(()=>{(window as unknown as {rejectOldPlay:()=>void}).rejectOldPlay();});await page.waitForTimeout(150);await expect(page.locator('.reading-error')).toHaveCount(0);
 }finally{await app.evaluate(({app})=>app.exit(0)).catch(()=>{});if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
