import {useEffect,useRef,useState} from 'react';
import {useReducedLessonMotion} from './reading-motion';
export function useVisibleLessonAnimation(active=true,identity?:string){
 const inForeground=()=>!document.hidden&&document.documentElement.dataset.windowHidden!=='true';
 const ref=useRef<HTMLElement>(null),[visible,setVisible]=useState(false),[foreground,setForeground]=useState(inForeground);
 const reduced=useReducedLessonMotion();
 useEffect(()=>{
  const element=ref.current;if(!element)return;
  const observer=new IntersectionObserver(entries=>setVisible(entries.some(entry=>entry.isIntersecting)),{threshold:[0,.01]});
  observer.observe(element);return()=>observer.disconnect();
 },[active,identity]);
 useEffect(()=>{const update=()=>setForeground(inForeground());document.addEventListener('visibilitychange',update);window.addEventListener('jective-window-visibility',update);update();return()=>{document.removeEventListener('visibilitychange',update);window.removeEventListener('jective-window-visibility',update);};},[]);
 return {ref,running:active&&visible&&foreground&&!reduced};
}
