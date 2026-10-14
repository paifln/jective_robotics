import React from 'react';
import {words} from './StudentUI';
export function EditorExpand({locale,expanded,toggle}:{locale:'en'|'ru'|'kk';expanded:boolean;toggle:()=>void}){
 return <button className="editor-expand icon-button" aria-pressed={expanded} aria-label={words(locale,'Expand editor','Развернуть редактор','Редакторды кеңейту')} title={expanded?words(locale,'Restore editor','Вернуть обычный вид','Қалыпты көрініске оралу'):words(locale,'Expand editor','Развернуть редактор','Редакторды кеңейту')} onClick={toggle}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{expanded?<path d="M9 3v6H3m12-6v6h6M9 21v-6H3m12 6v-6h6"/>:<path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6"/>}</svg></button>;
}
