import {useEffect,useRef,useState} from 'react';
import {useReducedLessonMotion} from './reading-motion';
import {useAppVisibility} from './useAppVisibility';
export function useVisibleLessonAnimation(active=true,identity?:string){
 const ref=useRef<HTMLElement>(null),[visible,setVisible]=useState(false),foreground=useAppVisibility();
 const reduced=useReducedLessonMotion();
 useEffect(()=>{
  const element=ref.current;if(!element)return;
  const observer=new IntersectionObserver(entries=>setVisible(entries.some(entry=>entry.isIntersecting)),{threshold:[0,.01]});
  observer.observe(element);return()=>observer.disconnect();
 },[active,identity]);
 return {ref,running:active&&visible&&foreground&&!reduced};
}
