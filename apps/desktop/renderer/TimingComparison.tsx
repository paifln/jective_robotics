import React from 'react';
import {cooperativeTimingSource} from '../../../packages/content/timing-source';
export function TimingComparison({locale}:{locale:'en'|'ru'|'kk'}){
 const titles={en:'Cooperative timing comparison — reviewed pin definitions required',ru:'Кооперативный таймер — нужны проверенные определения выводов',kk:'Кооперативтік таймер — тексерілген түйреуіш анықтамалары қажет'};
 const download={en:'Export cooperative source template',ru:'Экспорт шаблона кооперативного кода',kk:'Кооперативтік код үлгісін экспорттау'};
 return <details><summary>{titles[locale]}</summary><pre>{cooperativeTimingSource}</pre><button onClick={()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([cooperativeTimingSource],{type:'text/plain'}));a.download='two-indicator-cooperative.ino';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}}>{download[locale]}</button></details>;
}
