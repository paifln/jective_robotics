import React,{useLayoutEffect,useRef} from 'react';
import {useLocale} from './locale';
import {words} from './StudentUI';
import {JexiMascot} from './JexiMascot';

export type ChatExchange={id:string;question:string;answer:string};

/** Local presentation only: no credentials, requests or code-application actions. */
export function AssistantConversation({conversation,answer,pendingQuestion}:{conversation:ChatExchange[];answer:string;pendingQuestion:string|null}){
 const {locale}=useLocale(),log=useRef<HTMLDivElement>(null),follow=useRef(true),previousPending=useRef<string|null>(null);
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 useLayoutEffect(()=>{
  if(pendingQuestion!==null&&previousPending.current===null)follow.current=true;
  previousPending.current=pendingQuestion;
  if(log.current&&follow.current)log.current.scrollTop=log.current.scrollHeight;
 },[conversation,answer,pendingQuestion]);
 return <div ref={log} className="chat-transcript" role="log" aria-live="polite" aria-label={w('Conversation','Диалог','Әңгіме')} onScroll={event=>{const element=event.currentTarget;follow.current=element.scrollHeight-element.scrollTop-element.clientHeight<48;}}>
 {!conversation.length&&!pendingQuestion&&<div className="chat-welcome"><JexiMascot size="welcome"/><h3>{w('Hi, I’m Jexi!','Привет, я Jexi!','Сәлем, мен Jexi!' )}</h3><p>{w('A tricky task? Let’s work it out together. Ask me about your lesson or program.','Застрял на задании? Разберёмся вместе. Спроси меня об уроке или своей программе.','Тапсырма қиын ба? Бірге түсінейік. Сабақ немесе бағдарламаң туралы сұра.')}</p></div>}
 {conversation.map((turn,index)=><React.Fragment key={turn.id}><div className="chat-message chat-message-user" data-chat-turn={turn.id}><small>{w('You','Ты','Сен')}</small><p>{turn.question}</p></div>{(index<conversation.length-1||!answer)&&<div className="chat-message chat-message-assistant"><small>Jexi</small><pre>{turn.answer}</pre></div>}</React.Fragment>)}
 <div className="chat-message chat-message-assistant"><small>Jexi</small><pre className="assistant-answer">{answer}</pre></div>
 {pendingQuestion!==null&&<><div className="chat-message chat-message-user"><small>{w('You','Ты','Сен')}</small><p>{pendingQuestion}</p></div><div className="chat-waiting" aria-hidden="true"><span>Jexi</span><i/><i/><i/></div></>}
 </div>;
}
