import React,{useEffect,useRef,useState} from 'react';
import type {World} from '../../../packages/simulator';
import {readWorldFile} from '../../../packages/simulator/world-file';
import {exportLessonWorld} from '../../../packages/simulator/world-design';
import type {Locale} from './locale';
import {words} from './StudentUI';
import {downloadJSON} from './download';
export function WorldFiles({locale,world,apply}:{locale:Locale;world:World;apply:(world:World)=>void}){
 const input=useRef<HTMLInputElement>(null),request=useRef(0);const [busy,setBusy]=useState(false),[status,setStatus]=useState(''),[failed,setFailed]=useState(false);const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 useEffect(()=>()=>{request.current++;},[]);
 // Changing the active area supersedes any outstanding read.
 useEffect(()=>{request.current++;setBusy(false);},[world]);
 const open=async(file:File)=>{const token=++request.current;setBusy(true);setStatus('');setFailed(false);try{const next=await readWorldFile(file);if(token!==request.current)return;apply(next);setStatus(w('Area opened. The simulation is stopped.','Поле открыто. Симуляция остановлена.','Алаң ашылды. Симуляция тоқтатылды.'));}catch{if(token!==request.current)return;setFailed(true);setStatus(w('Could not open the area. Choose a valid JECTIVE world JSON file up to 1 MB. Your current area is unchanged.','Не удалось открыть поле. Выбери корректный JSON-файл поля JECTIVE размером до 1 МБ. Текущее поле не изменено.','Алаң ашылмады. 1 МБ-қа дейінгі дұрыс JECTIVE алаңының JSON файлын таңда. Қазіргі алаң өзгермеді.'));}finally{if(token===request.current)setBusy(false);}};
 return <div className="world-files"><div className="toolbar"><button disabled={busy} onClick={()=>input.current?.click()}>{busy?w('Opening area…','Открываем поле…','Алаң ашылуда…'):w('Open practice area','Открыть поле','Алаңды ашу')}</button><input hidden ref={input} type="file" accept=".json,application/json" aria-label={w('Practice area file','Файл поля','Алаң файлы')} onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void open(file);}}/><button onClick={()=>{downloadJSON('jective-world.json',exportLessonWorld(world));}}>{w('Save practice area','Сохранить поле','Алаңды сақтау')}</button></div>{status&&<p role={failed?'alert':'status'}>{status}</p>}</div>;
}
