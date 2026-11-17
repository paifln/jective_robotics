import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
test('Russian and Kazakh Studio labels, one-click USB upload and independent Code copy',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-localized-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;const app=await electron.launch({args:['.'],env});
 try{const page=await app.firstWindow();await expect(page.locator('#launch-screen')).toHaveCount(0);await app.evaluate(({BrowserWindow,ipcMain})=>{BrowserWindow.getAllWindows().forEach(w=>{w.setFocusable(false);w.webContents.setBackgroundThrottling(false);w.setPosition(-12000,-12000);w.on('show',()=>w.setPosition(-12000,-12000));w.showInactive();});ipcMain.removeHandler('devices:list');
 ipcMain.handle('devices:list',()=>({ok:true,value:[{path:'COM7',transport:'usb',manufacturer:'Arduino fixture'},{path:'COM8',transport:'bluetooth'}]}));
 const fixture=globalThis as typeof globalThis&{finishCompile:()=>void;finishUpload:()=>void};
 const build={operationId:'79c3c84b-06ef-4b89-80f2-e25f898605b1',sourceHash:'fixture',state:'succeeded',exitCode:0,log:'Compile fixture',artifacts:[]};
 ipcMain.removeHandler('build:compile');
 ipcMain.handle('build:compile',()=>new Promise(resolve=>{fixture.finishCompile=()=>resolve({ok:true,value:build});}));
 ipcMain.removeHandler('device:upload');
 ipcMain.handle('device:upload',(_event,request)=>{
  if(request.port!=='COM7'||request.operationId!==build.operationId||request.mode!=='run')throw new Error('UNEXPECTED_UPLOAD_TARGET');
  return new Promise(resolve=>{fixture.finishUpload=()=>resolve({ok:true,value:{...build,log:'Upload fixture'}});});
 });});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('header select:has(option[value=kk])').selectOption('ru');
 await page.locator('main>nav').getByRole('button',{name:'Студия',exact:true}).click();
 const language=page.locator('header select:has(option[value=kk])');
 for(const [locale,block,duplicate,remove] of [
  ['ru','начало','Дублировать','Удалить блок'],
  ['kk','бастау','Көшірмесін жасау','Блокты жою'],
  ['en','setup','Duplicate','Delete Block'],
 ] as const){
  await language.selectOption(locale);
  await page.locator('.blocklyBlockCanvas').getByText(block,{exact:true}).click({button:'right'});
  const menu=page.getByRole('menu').filter({hasText:duplicate});
  await expect(menu.getByRole('menuitem',{name:duplicate})).toBeVisible();
  await expect(menu.getByRole('menuitem',{name:remove})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
 }
 await language.selectOption('ru');
 const toolbar=page.locator('.studio-actions');
 const run=toolbar.getByRole('button',{name:'Запустить на плате',exact:true});
 const ports=page.locator('main>header').getByLabel('USB-порт',{exact:true});
 const status=toolbar.getByRole('status');
 await expect(ports.locator('option')).toHaveCount(2);
 await expect(run).toBeDisabled();
 await ports.selectOption('COM7');
 await expect(run).toBeEnabled();
 await run.click();
 await expect(status).toHaveText('Компиляция…');
 await expect(run.locator('.board-run-spinner')).toBeVisible();
 await expect(ports).toBeDisabled();
 await app.evaluate(()=>{(globalThis as typeof globalThis&{finishCompile:()=>void}).finishCompile();});
 await expect(status).toHaveText('Загрузка на COM7…');
 await expect(run).toBeDisabled();
 await expect(run.locator('.board-run-spinner')).toBeVisible();
 await app.evaluate(()=>{(globalThis as typeof globalThis&{finishUpload:()=>void}).finishUpload();});
 await expect(status).toContainText('Загружено на COM7.');
 await expect(run).toBeEnabled();
 await expect(page.locator('dialog[open]')).toHaveCount(0);
 await expect(page.locator('.output')).toContainText('Upload fixture');
 await page.locator('.student-settings>summary').click();await page.locator('.verification-details summary').click();await expect(page.getByText('Физическая проверка: НЕ ВЫПОЛНЕНО',{exact:true})).toBeVisible();await page.locator('header select:has(option[value=kk])').selectOption('kk');await expect(page.getByText('Физикалық тексеру: ОРЫНДАЛМАҒАН',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Тақшада іске қосу',exact:true})).toBeVisible();const name=await page.locator('.workspace-heading h1').innerText();await page.getByRole('button',{name:'Кодқа түрлендіру',exact:true}).click();await expect(page.locator('.code-files')).toBeVisible();await expect(page.getByRole('button',{name:'Кодқа түрлендіру',exact:true})).toBeDisabled();const after=await page.evaluate(()=>window.jective.workspace());if(!after.ok)throw new Error('WORKSPACE_FAILED');const original=after.value.recent.find(p=>p.name===name);expect(original).toBeTruthy();const saved=await page.evaluate(id=>window.jective.workspaceProject(id),original!.id);expect(saved.ok&&saved.value?.mode).toBe('blocks');await app.evaluate(({dialog})=>{dialog.showSaveDialog=async()=>({canceled:true,filePath:''});});await page.locator('.studio-actions').getByRole('button',{name:'Жобаны сақтау',exact:true}).click();await expect(page.locator('.output')).toContainText('SAVE_CANCELLED');const collapse=page.getByRole('button',{name:'Нәтижелерді жинау',exact:true});await collapse.focus();await page.keyboard.press('Enter');await expect(page.locator('.output>pre')).toBeHidden();await expect(page.getByRole('button',{name:'Нәтижелерді ашу',exact:true})).toHaveAttribute('aria-expanded','false');await page.locator('header select:has(option[value=kk])').selectOption('ru');const expand=page.getByRole('button',{name:'Развернуть результаты',exact:true});await expand.focus();await page.keyboard.press('Enter');await expect(page.locator('.output>pre')).toBeVisible();await expect(page.getByRole('button',{name:'Свернуть результаты',exact:true})).toHaveAttribute('aria-expanded','true');expect(errors).toEqual([]);
 }finally{await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(r=>app.process().once('exit',()=>r()));if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-localized-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
