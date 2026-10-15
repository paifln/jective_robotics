import {lstat,readFile} from 'node:fs/promises';
import {writeFileSync,renameSync,rmSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import type {BrowserWindow} from 'electron';
import {WindowPlacementSchema} from '../../../packages/contracts/window-placement';

export async function readWindowPlacement(path:string):Promise<unknown>{
 try{const info=await lstat(path);if(!info.isFile()||info.isSymbolicLink()||info.size>2048)return undefined;return WindowPlacementSchema.parse(JSON.parse(await readFile(path,'utf8')));}catch{return undefined;}
}

/** Tiny presentation preference, written atomically; learner project storage is separate. */
export function trackWindowPlacement(window:BrowserWindow,path:string,onFailure:()=>void){
 let timer:ReturnType<typeof setTimeout>|undefined;
 const save=()=>{
  if(window.isDestroyed()||window.isMinimized()||window.isFullScreen())return;
  const temporary=path+'.'+randomUUID()+'.tmp';
  try{
   const value=WindowPlacementSchema.parse({version:1,bounds:window.getNormalBounds(),maximized:window.isMaximized()});
   writeFileSync(temporary,JSON.stringify(value),{mode:0o600,flag:'wx'});renameSync(temporary,path);
  }catch{try{rmSync(temporary,{force:true});}catch{/* The unique temporary file can remain for administrator cleanup. */}onFailure();}
 };
 const schedule=()=>{if(timer)clearTimeout(timer);timer=setTimeout(save,350);};
 window.on('move',schedule);window.on('resize',schedule);window.on('maximize',schedule);window.on('unmaximize',schedule);
 const closing=()=>{if(timer)clearTimeout(timer);save();};window.on('close',closing);
 window.once('closed',()=>{if(timer)clearTimeout(timer);});
}
