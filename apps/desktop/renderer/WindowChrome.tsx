import React,{useEffect,useState} from 'react';
import type {Locale} from './locale';
import {words} from './StudentUI';
import {Brand} from './Brand';
import type {WindowAction,WindowState} from '../../../packages/contracts/window';

export function WindowChrome({locale,children}:React.PropsWithChildren<{locale:Locale}>){
 const [state,setState]=useState<WindowState>({maximized:false,fullscreen:false}),[error,setError]=useState(false);
 useEffect(()=>{
  let active=true;let unsubscribe=()=>{};
  try{
   if(!window.jective||typeof window.jective.onWindowState!=='function')throw new Error('BRIDGE_UNAVAILABLE');
   unsubscribe=window.jective.onWindowState(setState);
   void window.jective.windowState().then(result=>{if(active&&result.ok)setState(result.value);}).catch(()=>{if(active)setError(true);});
  }catch{setError(true);}
  return()=>{active=false;unsubscribe();};
 },[]);
 const act=async(action:WindowAction)=>{try{const result=await window.jective.windowAction(action);if(result.ok){setState(result.value);setError(false);}else setError(true);}catch{setError(true);}};
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 return <header className="window-chrome" data-maximized={state.maximized}>
  <div className="window-drag-area"><Brand/><span className="window-caption">Robotics Studio</span></div>
  {error&&<span role="status" className="window-control-error">{w('Use Alt+F4 to close','Для закрытия — Alt+F4','Жабу үшін — Alt+F4')}</span>}
  {children}
  <div className="window-controls">
   <button aria-label={w('Minimize window','Свернуть окно','Терезені кішірейту')} title={w('Minimize','Свернуть','Кішірейту')} onClick={()=>void act('minimize')}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10"/></svg></button>
   <button aria-label={state.maximized?w('Restore window','Восстановить окно','Терезені қалпына келтіру'):w('Maximize window','Развернуть окно','Терезені үлкейту')} title={state.maximized?w('Restore','Восстановить','Қалпына келтіру'):w('Maximize','Развернуть','Үлкейту')} onClick={()=>void act('toggleMaximize')}><svg viewBox="0 0 16 16" aria-hidden="true">{state.maximized?<path d="M5 5V3h8v8h-2M3 5h8v8H3z"/>:<path d="M3 3h10v10H3z"/>}</svg></button>
   <button className="window-close" aria-label={w('Close window','Закрыть окно','Терезені жабу')} title={w('Close','Закрыть','Жабу')} onClick={()=>void act('close')}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8"/></svg></button>
  </div>
 </header>;
}
