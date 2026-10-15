import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {englishWorkspace,programmingLesson} from './helpers/learning';
import {parkVerificationWindow} from './helpers/window';

test('lesson animation runs automatically only in view and respects reduced motion',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-lesson-animation-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await parkVerificationWindow(app);await page.emulateMedia({reducedMotion:'no-preference'});await englishWorkspace(page);await programmingLesson(page,'L04');
  const figure=page.locator('#L04-explanation>figure');await figure.scrollIntoViewIfNeeded();await expect(figure).toHaveAttribute('data-animation-state','running');const first=await figure.getAttribute('data-frame');await expect.poll(()=>figure.getAttribute('data-frame')).not.toBe(first);
  await page.locator('.lesson-heading h3').scrollIntoViewIfNeeded();await expect(figure).toHaveAttribute('data-animation-state','paused');const paused=await figure.getAttribute('data-frame');await page.waitForTimeout(180);await expect(figure).toHaveAttribute('data-frame',paused!);
  await figure.scrollIntoViewIfNeeded();await expect(figure).toHaveAttribute('data-animation-state','running');await page.emulateMedia({reducedMotion:'reduce'});await expect(figure).toHaveAttribute('data-animation-state','paused');const still=await figure.getAttribute('data-frame');await page.waitForTimeout(180);await expect(figure).toHaveAttribute('data-frame',still!);
  await page.emulateMedia({reducedMotion:'no-preference'});await expect(figure).toHaveAttribute('data-animation-state','running');await page.locator('main>nav').getByRole('button',{name:'Studio',exact:true}).click();await expect(figure).toHaveAttribute('data-animation-state','paused');await expect(page.getByRole('button',{name:'Enable animation',exact:true})).toHaveCount(0);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-lesson-animation-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
