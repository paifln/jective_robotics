import React,{useEffect,useRef,useState} from 'react';
import type {Project} from '../../../packages/contracts';
import {captureCodeReview,reviewStillCurrent,sourceContext} from '../../../packages/assistant/code-review';
import {AssistantConversation,type ChatExchange} from './AssistantConversation';
import {assistantConnectionFailure,assistantNotEnabled} from './assistant-copy';
import {assistantErrorText} from './assistant-error-text';
import {useLocale} from './locale';
import {words} from './StudentUI';

export function AssistantPanel({project,activeFile}:{project:Project;activeFile:string}){
 const {t,locale}=useLocale();
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 const [enabled,setEnabled]=useState(false);
 const [question,setQuestion]=useState('');
 const [share,setShare]=useState(false);
 const [attachment,setAttachment]=useState<File|null>(null);
 const [conversation,setConversation]=useState<ChatExchange[]>([]);
 const [pendingQuestion,setPendingQuestion]=useState<string|null>(null);
 const [settingsStatus,setSettingsStatus]=useState('');
 const [status,setStatus]=useState('');
 const [requestError,setRequestError]=useState<string|null>(null);
 const picker=useRef<HTMLInputElement>(null);
 const epoch=useRef(0);
 const pending=useRef(false);
 const file=project.mode==='code'&&Object.hasOwn(project.sourceFiles??{},activeFile)?activeFile:'sketch.ino';
 const latest=useRef({project,file});
 latest.current={project,file};
 const busy=pendingQuestion!==null;
 const clearStatus=()=>{setStatus('');setRequestError(null);};
 const cancel=()=>{
  epoch.current++;
  pending.current=false;
  setPendingQuestion(null);
  setRequestError(null);
  setStatus(w('Request cancelled','Запрос отменён','Сұрау тоқтатылды'));
  void window.jective.assistantCancel();
 };

 useEffect(()=>()=>{epoch.current++;if(pending.current)void window.jective.assistantCancel();},[]);
 useEffect(()=>{
  let alive=true,refreshId=0;
  const refresh=()=>{
   const id=++refreshId;
   setEnabled(false);
   void window.jective.assistantSettings().then(result=>{
    if(!alive||id!==refreshId)return;
    if(!result.ok){setSettingsStatus(assistantConnectionFailure[locale]);return;}
    const settings=result.value;
    const ready=settings.enabled&&settings.keyConfigured&&(settings.model==='jective-managed'||settings.endpoint==='https://api.openai.com/v1');
    setEnabled(ready);
    setSettingsStatus(ready?'':assistantNotEnabled[locale]);
   }).catch(()=>{if(alive&&id===refreshId)setSettingsStatus(assistantConnectionFailure[locale]);});
  };
  refresh();
  window.addEventListener('focus',refresh);
  window.addEventListener('assistant-settings-changed',refresh);
  return()=>{
   alive=false;
   window.removeEventListener('focus',refresh);
   window.removeEventListener('assistant-settings-changed',refresh);
  };
 },[locale]);

 const chooseFile=()=>{
  if(!picker.current)return;
  picker.current.value='';
  picker.current.click();
 };
 const ask=async()=>{
  if(pending.current||!enabled||!question.trim())return;
  const request=++epoch.current;
  pending.current=true;
  setPendingQuestion(question);
  setRequestError(null);
  setStatus(w('Thinking…','Думаю…','Ойланып жатырмын…'));
  try{
   const snapshot=share&&!attachment?captureCodeReview(project,file):null;
   let context=snapshot?sourceContext(snapshot.file,snapshot.original):'';
   if(share&&attachment){
    try{
     const source=await attachment.slice(0,140000).text();
     context=sourceContext(attachment.name.replace(/[\r\n]/g,' '),source);
    }catch{
     if(epoch.current===request)setStatus(w('Could not read the selected file.','Не удалось прочитать выбранный файл.','Таңдалған файлды оқу мүмкін болмады.'));
     return;
    }
   }
   if(epoch.current!==request)return;
   const history=conversation.flatMap(turn=>[
    {role:'user' as const,content:turn.question.slice(0,2000)},
    {role:'assistant' as const,content:turn.answer.slice(0,2000)}
   ]).slice(-10);
   const result=await window.jective.assistantAsk({question,context,history});
   if(epoch.current!==request)return;
   if(snapshot&&(latest.current.file!==snapshot.file||!reviewStillCurrent(latest.current.project,snapshot))){
    setStatus(w('Your code changed. Send the question again.','Код изменился. Отправь вопрос ещё раз.','Код өзгерді. Сұрақты қайта жібер.'));
    return;
   }
   if(result.ok){
    setConversation(previous=>[...previous,{id:crypto.randomUUID(),question,answer:result.value}].slice(-20));
    setQuestion('');
    setStatus('');
   }else{
    setStatus('');
    setRequestError(result.error.code);
   }
  }catch{
   if(epoch.current===request)setStatus(w('The request failed. Try again.','Запрос не выполнился. Попробуй ещё раз.','Сұрау орындалмады. Қайта байқап көр.'));
  }finally{
   if(epoch.current===request){
    pending.current=false;
    setPendingQuestion(null);
   }
  }
 };

 const newConversation=w('New conversation','Новый диалог','Жаңа әңгіме');
 const codeLabel=w('Add code from a file','Добавить код из файла','Файлдан код қосу');
 return <section className="feature student-help">
  <section className="feature learner-chat">
   <div className="chat-heading">
    <h2>{w('Ask Jexi','Спроси Jexi','Jexi-ден сұра')}</h2>
    <button disabled={busy||!conversation.length} onClick={()=>{setConversation([]);setQuestion('');clearStatus();}}>{newConversation}</button>
   </div>
   <p className="chat-caption" hidden={conversation.length>0}>{w('Ask about your task. Check suggestions before using them.','Спроси о своём задании. Проверяй подсказки перед использованием.','Тапсырмаң туралы сұра. Кеңесті қолданар алдында тексер.')}</p>
   {settingsStatus&&<p className="assistant-settings-status" role="status">{settingsStatus}</p>}
   <AssistantConversation conversation={conversation} answer={conversation.at(-1)?.answer??''} pendingQuestion={pendingQuestion}/>
   <div className="chat-composer">
    <label>{t('Question')}<textarea aria-label={t('Question')} placeholder={w('Message Jexi…','Напиши Jexi…','Jexi-ге жаз…')} disabled={busy} value={question} maxLength={8000} onKeyDown={event=>{
     if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){
      event.preventDefault();
      event.stopPropagation();
      void ask();
     }
    }} onChange={event=>setQuestion(event.target.value)}/></label>
    <button className="chat-send" data-busy={busy} aria-label={t('Request hint')} title={t('Request hint')+' (Enter · Shift+Enter ↵)'} disabled={!enabled||!question.trim()||busy} onClick={()=>void ask()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 9-18 9 4-9Zm4 9h14"/></svg></button>
    <button className="chat-cancel" aria-label={t('Cancel request')} title={t('Cancel request')} disabled={!busy} onClick={cancel}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></button>
    <div className="chat-code-source">
     <label className="chat-code-toggle">
      <input type="checkbox" disabled={busy} checked={share} onChange={event=>setShare(event.target.checked)}/>
      <span className="chat-code-check" aria-hidden="true"/>
      {codeLabel}:
     </label>
     <select aria-label={w('Code source','Источник кода','Код көзі')} disabled={!share||busy} value={attachment?'file':'current'} onChange={event=>{
      if(event.currentTarget.value==='file'){
       event.currentTarget.value=attachment?'file':'current';
       chooseFile();
      }else setAttachment(null);
     }}>
      <option value="current">{w('Current','Текущий','Ағымдағы')}</option>
      <option value="file">{w('From file','Из файла','Файлдан')}</option>
     </select>
     <input type="file" hidden ref={picker} accept=".ino,.pde,.h,.hpp,.hh,.c,.cc,.cpp,.cxx,.txt,text/plain" onChange={event=>{
      const selected=event.target.files?.[0];
      if(selected)setAttachment(selected);
     }}/>
     {share&&(attachment
      ?<button className="chat-code-file" type="button" disabled={busy} title={attachment.name} onClick={chooseFile}>{attachment.name}</button>
      :<span className="chat-code-file" title={file}>{file}</span>)}
    </div>
    <p className="assistant-request-status" role="status">{requestError?assistantErrorText({code:requestError},locale):t(status)}</p>
   </div>
  </section>
 </section>;
}
