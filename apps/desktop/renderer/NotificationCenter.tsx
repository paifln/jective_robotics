import React,{useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {NotificationStore,type NotificationCode} from '../../../packages/engagement/notifications';
import type {Locale} from './locale';
import {words} from './StudentUI';

export const studioNotifications=new NotificationStore();
const labels:Record<NotificationCode,readonly [string,string,string]>={
 'project-saved':['Project saved','Проект сохранён','Жоба сақталды'],
 'build-ready':['Code check completed','Проверка кода завершена','Код тексерілді'],
 'build-failed':['There is something to fix in the code','В коде есть то, что можно исправить','Кодта түзетуге болатын нәрсе бар'],
 'build-cancelled':['Code check stopped','Проверка кода остановлена','Кодты тексеру тоқтатылды']
};
export function NotificationCenter({locale}:{locale:Locale}){
 const items=useSyncExternalStore(studioNotifications.subscribe,studioNotifications.snapshot),[open,setOpen]=useState(false),[toast,setToast]=useState<number|null>(null),[paused,setPaused]=useState(false);
 const container=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null),seen=useRef(0),count=items.filter(item=>!item.read).length;
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk),text=(code:NotificationCode)=>labels[code][locale==='en'?0:locale==='ru'?1:2];
 useEffect(()=>{const newest=items[0];if(newest&&newest.id>seen.current){seen.current=newest.id;if(!open)setToast(newest.id);else studioNotifications.markRead();}},[items,open]);
 useEffect(()=>{if(toast===null||paused)return;const timer=setTimeout(()=>setToast(null),6500);return()=>clearTimeout(timer);},[toast,paused]);
 useEffect(()=>{if(!open)return;const dismiss=(event:PointerEvent)=>{if(!container.current?.contains(event.target as Node))setOpen(false);};const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!event.defaultPrevented&&!event.isComposing){event.preventDefault();setOpen(false);button.current?.focus();}};document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);};},[open]);
 const latest=items.find(item=>item.id===toast);
 return <div ref={container} className="notification-center" onKeyDown={event=>{if(open&&event.key==='Escape'){event.preventDefault();setOpen(false);button.current?.focus();}}}>
  <button ref={button} className="notification-bell icon-button" aria-label={w('Notifications','Уведомления','Хабарландырулар')} aria-expanded={open} aria-controls="notification-history" onClick={()=>{setOpen(!open);setToast(null);if(!open)studioNotifications.markRead();}}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16V10a7 7 0 0 1 14 0v6l2 3H3Zm5 5h4"/></svg>{count>0&&<span className="notification-count">{count}</span>}</button>
  {open&&<section id="notification-history" className="notification-history" aria-label={w('Notification history','История уведомлений','Хабарландырулар тарихы')}><header><h2>{w('Notifications','Уведомления','Хабарландырулар')}</h2><button disabled={!items.length} onClick={()=>studioNotifications.clear()}>{w('Clear','Очистить','Тазарту')}</button></header>{!items.length?<p className="notification-empty">{w('All quiet. You can focus on your ideas.','Пока всё спокойно. Можно сосредоточиться на своих идеях.','Әзірге бәрі тыныш. Идеяларыңа көңіл бөлуге болады.')}</p>:<ol>{items.map(item=><li key={item.id} data-code={item.code}><span className="notification-status-icon" aria-hidden="true">{item.code==='project-saved'||item.code==='build-ready'?'✓':'•'}</span><div><strong>{text(item.code)}</strong>{item.detail&&<p>{item.detail}</p>}<time dateTime={new Date(item.time).toISOString()}>{new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit'}).format(item.time)}</time></div></li>)}</ol>}</section>}
  {latest&&!open&&<div className="studio-toast" role="status" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocus={()=>setPaused(true)} onBlur={()=>setPaused(false)}><span className="notification-status-icon" aria-hidden="true">{latest.code==='build-failed'?'•':'✓'}</span><div><strong>{text(latest.code)}</strong>{latest.detail&&<p>{latest.detail}</p>}</div><button aria-label={w('Dismiss notification','Скрыть уведомление','Хабарландыруды жасыру')} onClick={()=>{setToast(null);setPaused(false);}}>×</button></div>}
 </div>;
}
