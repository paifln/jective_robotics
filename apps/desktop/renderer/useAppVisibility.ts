import {useEffect,useState} from 'react';
/** Native minimize/hide is authoritative even if Chromium keeps background timers enabled. */
export function useAppVisibility(){
 const current=()=>!document.hidden&&document.documentElement.dataset.windowHidden!=='true';
 const [visible,setVisible]=useState(current);
 useEffect(()=>{
  const update=()=>setVisible(current());
  document.addEventListener('visibilitychange',update);window.addEventListener('jective-window-visibility',update);update();
  return()=>{document.removeEventListener('visibilitychange',update);window.removeEventListener('jective-window-visibility',update);};
 },[]);
 return visible;
}
