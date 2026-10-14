import React,{useEffect,useRef,useState} from 'react';
import type {JournalPage} from '../../../packages/contracts/compiler-journal';
import type {Locale} from './locale';
import {words} from './StudentUI';
import {operationErrorText} from './operation-error-text';

export function CompilerJournal({operationId,locale}:{operationId:string;locale:Locale}){
 const [page,setPage]=useState<JournalPage|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[history,setHistory]=useState<number[]>([]);
 const request=useRef(0);useEffect(()=>()=>{request.current++;},[]);
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 async function load(offset:number,move:'initial'|'next'|'previous'='initial'){const token=++request.current;setBusy(true);setError('');try{const result=await window.jective.journalPage(operationId,offset);if(token!==request.current)return;if(result.ok){if(move==='next')setHistory(current=>[...current,page!.offset]);if(move==='previous')setHistory(current=>current.slice(0,-1));setPage(result.value);}else setError(operationErrorText(result.error,locale));}catch{if(token===request.current)setError(w('Could not read the log.','Не удалось прочитать журнал.','Журналды оқу мүмкін болмады.'));}finally{if(token===request.current)setBusy(false);}}
 return <details className="compiler-journal" data-operation-id={operationId} onToggle={event=>{if(event.currentTarget.open&&!page&&!busy)void load(0);}}><summary>{w('Full compiler log','Полный журнал компилятора','Компилятордың толық журналы')}</summary>
 <p>{w('The full file may include code fragments and local file paths. Review it before sharing. The build report contains only the shorter screen log.','Полный файл может содержать фрагменты кода и пути к локальным файлам. Проверь его перед отправкой. Отчёт сборки содержит только сокращённый экранный журнал.','Толық файлда код үзінділері мен жергілікті файл жолдары болуы мүмкін. Бөліспес бұрын тексер. Құрастыру есебінде тек қысқартылған экран журналы бар.')}</p>
 {busy&&<p role="status">{w('Working…','Подождите…','Күте тұрыңыз…')}</p>}
 {error&&<p role="alert">{error}</p>}{!page&&error&&<button disabled={busy} onClick={()=>void load(0)}>{w('Try reading again','Повторить чтение','Қайта оқу')}</button>}{page&&<><p>{page.offset}–{page.nextOffset} / {page.totalBytes} {w('bytes','байт','байт')}</p><pre style={{maxHeight:320,overflow:'auto',whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{page.text}</pre></>}
 <div className="toolbar"><button disabled={busy||!history.length} onClick={()=>{const offset=history.at(-1)!;void load(offset,'previous');}}>{w('Previous','Назад','Артқа')}</button><button disabled={busy||!page||page.complete} onClick={()=>{if(page){void load(page.nextOffset,'next');}}}>{w('Next','Далее','Келесі')}</button><button disabled={busy||!page} onClick={async()=>{setBusy(true);setError('');try{const result=await window.jective.journalExport(operationId);if(!result.ok)setError(operationErrorText(result.error,locale));}catch{setError(w('Could not save the log.','Не удалось сохранить журнал.','Журналды сақтау мүмкін болмады.'));}finally{setBusy(false);}}}>{w('Save full log…','Сохранить полный журнал…','Толық журналды сақтау…')}</button></div>
 </details>;
}
