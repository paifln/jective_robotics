import {useEffect,useState} from 'react';
export const readingMotionEvent='jective-reading-motion';
export function useReducedLessonMotion(){
 const [reduced,setReduced]=useState(()=>document.body.dataset.readingStill==='true'||matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const system=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(document.body.dataset.readingStill==='true'||system.matches);window.addEventListener(readingMotionEvent,update);system.addEventListener('change',update);update();return()=>{window.removeEventListener(readingMotionEvent,update);system.removeEventListener('change',update);};},[]);
 return reduced;
}
