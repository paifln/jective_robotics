import React,{useEffect,useRef,useState} from 'react';
import type {LearningRecord} from '../../../packages/content/learning-records';
import type {Locale} from './locale';
import {words} from './StudentUI';

/** Failed reads never turn an empty form into a writable replacement. */
export function useLearningLoad(id:string,apply:(record:LearningRecord|null)=>void){
 const applyRef=useRef(apply);applyRef.current=apply;
 const [attempt,setAttempt]=useState(0),[state,setState]=useState<{id:string;attempt:number;phase:'loading'|'ready'|'failed';code?:string}>({id,attempt:0,phase:'loading'});
 useEffect(()=>{let active=true;setState({id,attempt,phase:'loading'});void (async()=>{
  try{const result=await window.jective.learningLoad(id);if(!active)return;if(!result.ok){setState({id,attempt,phase:'failed',code:result.error.code});return;}applyRef.current(result.value);setState({id,attempt,phase:'ready'});}
  catch{if(active)setState({id,attempt,phase:'failed'});}
 })();return()=>{active=false;};},[id,attempt]);
 const phase=state.id===id&&state.attempt===attempt?state.phase:'loading';
 return {loaded:phase==='ready',failed:phase==='failed',code:phase==='failed'?state.code:undefined,retry:()=>setAttempt(v=>v+1)};
}

export function LearningLoadNotice({load,locale}:{load:ReturnType<typeof useLearningLoad>;locale:Locale}){
 if(load.loaded)return null;
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 return <div className="learning-load-notice" role={load.failed?'alert':'status'}><p>{load.failed&&load.code==='LEARNING_RECORD_STATE_INVALID'?w('Your saved result does not match the answers. Editing is paused to protect your work. Ask a teacher to check this record, then retry loading.','Сохранённый результат не совпадает с ответами. Редактирование приостановлено, чтобы сохранить твою работу. Попроси учителя проверить запись, затем повтори загрузку.','Сақталған нәтиже жауаптарға сәйкес емес. Жұмысыңды сақтау үшін өңдеу тоқтатылды. Мұғалімнен жазбаны тексеруді сұра, содан кейін қайта жүкте.'):load.failed?w('Your saved answers could not be opened. Editing is paused to protect them. Retry loading.','Не удалось открыть сохранённые ответы. Редактирование остановлено, чтобы сохранить твою работу. Повтори загрузку.','Сақталған жауаптар ашылмады. Жұмысыңды қорғау үшін өңдеу тоқтатылды. Қайта жүктеп көр.'):w('Opening your saved answers…','Загружаем сохранённые ответы…','Сақталған жауаптар жүктелуде…')}</p>{load.failed&&<button onClick={load.retry}>{w('Retry loading','Повторить загрузку','Қайта жүктеу')}</button>}</div>;
}
