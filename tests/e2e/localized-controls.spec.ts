import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';

test('navigation, sound and numeric-answer accessible names follow the selected language',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-local-controls-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((e):e is [string,string]=>e[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({args:['.'],env});
 try{
  const page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.setPosition(-12000,-12000);w.webContents.setBackgroundThrottling(false);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();}));
  await page.locator('main>header>label>select').selectOption('en');await page.locator('.content>.toolbar').getByRole('button',{name:'Programming',exact:true}).click();await page.getByRole('button',{name:/^L01 ·/}).click();
  await page.setViewportSize({width:800,height:700});
  for(const [locale,navigation,sound,numeric,learn] of [
   ['en','Workspace sections','Interface sounds','Numeric answer','Learn'],
   ['ru','Разделы приложения','Звуки интерфейса','Числовой ответ','Уроки'],
   ['kk','Қолданба бөлімдері','Интерфейс дыбыстары','Сандық жауап','Сабақтар']
  ] as const){
   await page.locator('main>header>label>select').selectOption(locale);
   const nav=page.getByRole('navigation',{name:navigation,exact:true});await expect(nav).toBeVisible();
   const toggle=page.getByRole('button',{name:sound,exact:true});await expect(toggle).toHaveAttribute('title',sound);await toggle.focus();await expect(toggle).toBeFocused();
   const before=await toggle.getAttribute('aria-pressed');await page.keyboard.press('Space');await expect(toggle).toHaveAttribute('aria-pressed',before==='true'?'false':'true');
   const field=page.getByRole('textbox',{name:numeric,exact:true});await field.fill('2');await expect(field).toHaveValue('2');
   await nav.getByRole('button',{name:learn,exact:true}).focus();await page.keyboard.press('End');await expect(nav.locator('button[data-section=device]')).toBeFocused();
   await page.keyboard.press('Home');await expect(nav.getByRole('button',{name:learn,exact:true})).toBeFocused();
   // Ordinary pointer clicks must reach the fixed rail above Blockly's toolbox.
   await nav.locator('button[data-section=studio]').click();await expect(page.locator('.studio .blocklyToolbox')).toBeVisible();
   await nav.getByRole('button',{name:learn,exact:true}).click();await expect(field).toBeVisible();await expect(field).toHaveValue('2');
  }
 }finally{
  if(app.process().exitCode===null&&app.process().signalCode===null)await app.evaluate(({app})=>app.exit(0)).catch(()=>{});
  if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(done=>app.process().once('exit',()=>done()));
  if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-local-controls-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});
 }
});
