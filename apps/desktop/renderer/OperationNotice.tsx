import React from 'react';
import type {Locale} from './locale';
import {operationErrorText} from './operation-error-text';
import {words} from './StudentUI';

/** File actions also happen outside Studio, where the compiler output is hidden. */
export function OperationNotice({error,locale,dismiss}:{error:{code:string;message:string}|null;locale:Locale;dismiss:()=>void}){
 if(!error)return null;
 return <aside className="operation-notice" role="alert">
  <span className="operation-notice-icon" aria-hidden="true">!</span>
  <div><strong>{words(locale,'Action could not be completed','Не удалось выполнить действие','Әрекетті аяқтау мүмкін болмады')}</strong><p>{operationErrorText(error,locale)}</p></div>
  <button className="icon-button" aria-label={words(locale,'Dismiss message','Скрыть сообщение','Хабарды жасыру')} onClick={dismiss}>×</button>
 </aside>;
}
