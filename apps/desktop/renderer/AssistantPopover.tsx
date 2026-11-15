import React,{useEffect,useRef,useState} from 'react';
import {useLocale} from './locale';
import {words} from './StudentUI';
import {JexiMascot} from './JexiMascot';

export function AssistantPopover({open,setOpen,children}:{open:boolean;setOpen:(open:boolean)=>void;children:React.ReactNode}){
 const {locale}=useLocale(),panel=useRef<HTMLElement>(null),launcher=useRef<HTMLButtonElement>(null),previous=useRef<HTMLElement|null>(null);
 const [top,setTop]=useState(100);
 useEffect(()=>{
  if(!open)return;
  let frame=0;
  const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const toolbar=document.querySelector('.studio:not([hidden]) .studio-toolbar');
   const header=document.querySelector('main>header');
   setTop(Math.max(88,(toolbar??header)?.getBoundingClientRect().bottom??88)+8);
  });};
  const main=document.querySelector('main'),toolbar=document.querySelector('.studio-toolbar');
  const observer=new ResizeObserver(update);if(toolbar)observer.observe(toolbar);if(main)observer.observe(main);
  main?.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);update();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();main?.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
 },[open]);
 useEffect(()=>{
  if(!open)return;
  previous.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const frame=requestAnimationFrame(()=>panel.current?.querySelector<HTMLButtonElement>('.assistant-popover-close')?.focus({preventScroll:true}));
  return()=>{cancelAnimationFrame(frame);if(panel.current?.contains(document.activeElement)){const target=previous.current?.isConnected?previous.current:launcher.current;target?.focus({preventScroll:true});}};
 },[open]);
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 return <>
  <button ref={launcher} className="assistant-launcher" aria-label={w('Ask for help','Помощник','Көмекші')} aria-expanded={open} aria-controls="assistant-popover" onClick={()=>setOpen(!open)} title={w('Your robotics helper','Твой помощник по робототехнике','Робототехника көмекшің')}>
   <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 8h16a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-9l-6 4v-4H8a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" fill="currentColor"/><path d="M11 15v3m10-3v3m-8 3h6M16 4v4" stroke="#5235ce" strokeWidth="2.5" strokeLinecap="round"/></svg>
   <span className="assistant-launcher-spark" aria-hidden="true">✦</span>
  </button>
  <section id="assistant-popover" ref={panel} className="assistant-popover" style={{'--assistant-top':top+'px'} as React.CSSProperties} hidden={!open} role="dialog" aria-modal="false" aria-label={w('JECTIVE assistant','Помощник JECTIVE','JECTIVE көмекшісі')} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);}}}>
   <div className="assistant-popover-title"><JexiMascot/><div><strong>Jexi <span className="jexi-status-dot" aria-hidden="true"/></strong><small>{w('Your robotics companion','Рядом, чтобы помочь разобраться','Бірге түсінуге көмектесемін')}</small></div><button className="assistant-popover-close" aria-label={w('Minimize chat','Свернуть чат','Чатты жинау')} onClick={()=>setOpen(false)}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12"/></svg></button></div>
   {children}
  </section>
 </>;
}
