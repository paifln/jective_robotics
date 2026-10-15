import {test,expect,_electron as electron} from '@playwright/test';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';

test('native window geometry survives a restart without sending positions through renderer IPC',async()=>{
 test.setTimeout(90000);const root=await mkdtemp(join(tmpdir(),'jective-window-placement-'));
 const env:Record<string,string>=Object.fromEntries(Object.entries(process.env).filter((entry):entry is [string,string]=>entry[1]!==undefined));delete env.ELECTRON_RUN_AS_NODE;env.JECTIVE_WORKSPACE_ROOT=root;
 let app:Awaited<ReturnType<typeof electron.launch>>|undefined;
 const stop=async()=>{if(!app)return;await app.evaluate(({app})=>app.exit(0));if(app.process().exitCode===null&&app.process().signalCode===null)await new Promise<void>(resolve=>app!.process().once('exit',()=>resolve()));app=undefined;};
 try{
  app=await electron.launch({args:['.'],env});const page=await app.firstWindow();page.on('dialog',dialog=>{if(dialog.type()!=='beforeunload')void dialog.dismiss();});await expect(page.locator('#launch-screen')).toHaveCount(0);
  const expected=await app.evaluate(({BrowserWindow,screen})=>{const window=BrowserWindow.getAllWindows()[0]!,area=screen.getPrimaryDisplay().workArea;window.setFocusable(false);window.unmaximize();const bounds={x:area.x+20,y:area.y+20,width:Math.min(1000,area.width-20),height:Math.min(620,area.height-20)};window.setBounds(bounds);return window.getNormalBounds();});
  await expect.poll(async()=>{try{return JSON.parse(await readFile(join(root,'window-placement.json'),'utf8')).bounds;}catch{return null;}}).toEqual(expected);
  await stop();app=await electron.launch({args:['.'],env});const second=await app.firstWindow();second.on('dialog',dialog=>{if(dialog.type()!=='beforeunload')void dialog.dismiss();});await expect(second.locator('.window-chrome')).toBeVisible();
  expect(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0]!.getNormalBounds())).toEqual(expected);
  const denied=await second.evaluate(async()=>{try{await window.jective.windowAction({action:'move',x:-99999} as unknown as 'close');return false;}catch{return true;}});expect(denied).toBe(true);expect(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length)).toBe(1);
 }finally{await stop();if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-window-placement-'))throw new Error('UNSAFE_CLEANUP');await rm(root,{recursive:true,force:true,maxRetries:20,retryDelay:100});}
});
