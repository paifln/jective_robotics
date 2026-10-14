import {useLessonAudio} from './useLessonAudio';
import {useReadingPreferences,updateReadingPreferences} from './reading-preferences';
import React,{useEffect,useId,useRef,useState} from 'react';
import type {Locale} from './locale';
import {words} from './StudentUI';
export function ReadingTools({id,locale}:{id:string;locale:Locale}){
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk),root=useRef<HTMLDivElement>(null);
 const [open,setOpen]=useState(false);
 const {audio,speed,failed,playing,available,toggle,changeSpeed,setFailed,setPlaying}=useLessonAudio(id,locale);
 const {size,spaced,still}=useReadingPreferences(),popoverId=useId();
 useEffect(()=>{if(open)root.current?.querySelector<HTMLSelectElement>('.reading-popover select')?.focus();},[open]);
 const listen=w('Listen to lesson theory','Послушать урок','Сабақты тыңдау'),pause=w('Pause narration','Приостановить чтение','Оқуды кідірту'),settings=w('Reading settings','Настройки чтения','Оқу баптаулары');
 useEffect(()=>setOpen(false),[id,locale]);
 useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{if(e.target instanceof Node&&!root.current?.contains(e.target))setOpen(false);},escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);root.current?.querySelector<HTMLButtonElement>('[aria-expanded]')?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[open]);

 const unavailable=w('Recording is not available in this language yet','Запись на этом языке пока недоступна','Бұл тілдегі жазба әзірге жоқ');
 return <div ref={root} className="reading-tools" role="group" aria-label={settings} onBlur={e=>{if(e.relatedTarget instanceof Node&&!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}>
 <button className="reading-icon" disabled={!available} aria-label={playing?pause:listen} title={available?(playing?pause:listen):unavailable} aria-pressed={playing} onClick={toggle}><svg viewBox="0 0 24 24" aria-hidden="true">{playing?<path d="M8 5v14M16 5v14"/>:<><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="M17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>}</svg></button>
 <button className="reading-icon" aria-label={settings} title={settings} aria-expanded={open} aria-controls={open?popoverId:undefined} onClick={()=>setOpen(!open)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 19 6-14 6 14M5 14h8m4 5 3-8 3 8m-5-3h4"/></svg></button>
 {available&&<audio key={id+locale} ref={audio} preload="none" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onError={()=>setFailed(true)} onLoadedMetadata={()=>{if(audio.current)audio.current.playbackRate=speed;}} src={`learning/audio/${id}-${locale}.ogg`}/>}
 {open&&<div id={popoverId} className="reading-popover" role="group" aria-label={settings}><label>{w('Text size','Размер текста','Мәтін өлшемі')}<select aria-label={w('Text size','Размер текста','Мәтін өлшемі')} value={size} onChange={e=>updateReadingPreferences({size:Number(e.target.value)})}>{[16,18,20,24].map(n=><option key={n} value={n}>{n} px</option>)}</select></label><label><input type="checkbox" checked={spaced} onChange={e=>updateReadingPreferences({spaced:e.target.checked})}/>{w('More line spacing','Больше расстояние между строками','Жол аралығын үлкейту')}</label><label><input type="checkbox" checked={still} onChange={e=>updateReadingPreferences({still:e.target.checked})}/>{w('Reduce motion','Уменьшить анимации','Анимацияны азайту')}</label>{available&&<label>{w('Playback speed','Скорость чтения','Оқу жылдамдығы')}<select aria-label={w('Playback speed','Скорость чтения','Оқу жылдамдығы')} value={speed} onChange={e=>{changeSpeed(Number(e.target.value));}}>{[.75,1,1.25,1.5].map(n=><option key={n} value={n}>{n}×</option>)}</select></label>}</div>}
 {failed&&<span className="reading-error" role="alert">{w('Recording could not be played.','Не удалось воспроизвести запись.','Жазбаны ойнату мүмкін болмады.')}</span>}
 </div>;
}
