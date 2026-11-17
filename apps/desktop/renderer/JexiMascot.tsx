import React,{useEffect,useRef,useState} from 'react';

/** Local artwork; CSS motion runs only while this character is visible. */
export function JexiMascot({size='small'}:{size?:'small'|'welcome'}){
 const element=useRef<HTMLSpanElement>(null),[active,setActive]=useState(false);
 useEffect(()=>{
  let visible=false;
  const refresh=()=>setActive(visible&&document.visibilityState==='visible'&&document.documentElement.dataset.windowHidden!=='true');
  const observer=new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);refresh();});
  if(element.current)observer.observe(element.current);
  const windowObserver=new MutationObserver(refresh);windowObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-window-hidden']});
  document.addEventListener('visibilitychange',refresh);
  return()=>{observer.disconnect();windowObserver.disconnect();document.removeEventListener('visibilitychange',refresh);};
 },[]);
 return <span ref={element} className={'jexi-mascot jexi-mascot-'+size} data-active={active} aria-hidden="true"><img src={size==='welcome'?'jexi.png':'jexi-avatar.png'} alt="" draggable={false}/></span>;
}
