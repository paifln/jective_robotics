import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('explicit injected protocol test fixtures render a telemetry plot and export actual CSV',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-telemetry-fixture-'));const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 const app=await electron.launch({executablePath:process.env.JECTIVE_EXECUTABLE,args:process.env.JECTIVE_EXECUTABLE?[]:['.'],env});
 try{
  const page=await app.firstWindow();await expect(page.locator('.monaco-editor').first()).toHaveAttribute('data-source',new RegExp('digitalWrite'.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));await page.getByRole('button',{name:'Device',exact:true}).click();
  await expect(page.getByText('No valid telemetry samples received.',{exact:true})).toBeVisible();
  await app.evaluate(({BrowserWindow})=>{for(let seq=0;seq<3;seq++)BrowserWindow.getAllWindows()[0]!.webContents.send('serial:event',{timestamp:new Date(1000+seq*100).toISOString(),kind:'protocol',text:JSON.stringify({v:1,type:'telemetry',seq,values:{distance:seq*.25}}),connection:{id:'00000000-0000-4000-8000-000000000001',port:'EXPLICIT_TEST_FIXTURE_NO_PHYSICAL_BOARD',baud:115200}});});
  await expect(page.getByRole('img',{name:'Serial telemetry plot',exact:true})).toBeVisible();await expect(page.getByLabel('Telemetry series')).toContainText('EXPLICIT_TEST_FIXTURE');await page.getByLabel('Unit annotation (user supplied)').fill('m');
  const path=join(root,'telemetry.csv');await app.evaluate(({session},file)=>{session.defaultSession.once('will-download',(_event,item)=>item.setSavePath(file));},path);await page.getByRole('button',{name:'Export telemetry CSV',exact:true}).click();
  await expect.poll(async()=>{try{return (await readFile(path,'utf8')).includes('serial-receipt');}catch{return false;}}).toBe(true);const csv=await readFile(path,'utf8');expect(csv).toContain('EXPLICIT_TEST_FIXTURE_NO_PHYSICAL_BOARD');expect(csv).toContain('user annotation; not device-verified');expect(csv).toContain('0.5');
  await page.getByRole('img',{name:'Serial telemetry plot',exact:true}).screenshot({path:'test-results/telemetry.png'});
  await app.evaluate(({BrowserWindow})=>{for(const [seq,value] of [[3,-1e308],[4,1e308]])BrowserWindow.getAllWindows()[0]!.webContents.send('serial:event',{timestamp:new Date(1000+seq!*100).toISOString(),kind:'protocol',text:JSON.stringify({v:1,type:'telemetry',seq,values:{distance:value}}),connection:{id:'00000000-0000-4000-8000-000000000001',port:'EXPLICIT_TEST_FIXTURE_NO_PHYSICAL_BOARD',baud:115200}});});
  await expect.poll(async()=>{const points=await page.getByRole('img',{name:'Serial telemetry plot',exact:true}).locator('polyline').getAttribute('points');return points?.split(' ').length;}).toBe(5);
  const points=await page.getByRole('img',{name:'Serial telemetry plot',exact:true}).locator('polyline').getAttribute('points');expect(points).not.toContain('NaN');expect(points).not.toContain('Infinity');
  await page.getByText('Sample table (5)',{exact:true}).click();await expect(page.getByRole('columnheader',{name:'Receipt timestamp',exact:true})).toBeVisible();await expect(page.locator('table tbody tr')).toHaveCount(5);
  await page.getByLabel('Language',{exact:true}).selectOption('kk');await expect(page.getByRole('columnheader',{name:'Қабылдау уақыты',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Телеметрияны CSV экспорттау',exact:true})).toBeVisible();
  await page.getByLabel('Тіл',{exact:true}).selectOption('ru');await expect(page.getByRole('columnheader',{name:'Время приёма',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Экспорт телеметрии CSV',exact:true})).toBeVisible();
 }finally{await app.evaluate(({app})=>app.exit(0));await rm(root,{recursive:true,force:true,maxRetries:30,retryDelay:100});}
});
