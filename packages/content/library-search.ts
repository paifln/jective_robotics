type Locale='en'|'ru'|'kk';
export type LibraryRecord={id:string;title:Record<Locale,string>};
type Entry<T>={record:T;id:string;title:string;text:string;position:number};
const fields=['body','objectives','safety','explanation','workedExample','activity','challenge','observations','troubleshooting','evidence','materials','tools','mechanical','wiring','inspection','calibration','diagnostics','shutdown','alternatives'] as const;
const normalize=(text:string,locale:Locale)=>text.normalize('NFKC').toLocaleLowerCase(locale);
/** Index only bundled learner-facing localized text, not project files or credentials. */
export function indexLibrary<T extends LibraryRecord>(records:readonly T[],locale:Locale):Entry<T>[] {
 return records.map((record,position)=>{
  const text=[record.id,record.title[locale]],title=normalize(text.join(' '),locale);
  for(const field of fields){const value:unknown=Reflect.get(record,field);if(value&&typeof value==='object'){const localized:unknown=Reflect.get(value,locale);if(typeof localized==='string')text.push(localized);}}
  return {record,id:normalize(record.id,locale),title,text:normalize(text.join(' '),locale),position};
 });
}
export function searchLibrary<T>(index:readonly Entry<T>[],query:string,locale:Locale):T[]{
 const normalized=normalize(query,locale).trim(),terms=normalized.split(/\s+/).filter(Boolean);
 const rank=(entry:Entry<T>)=>entry.id===normalized?0:terms.every(term=>entry.title.includes(term))?1:2;
 return index.filter(entry=>terms.every(term=>entry.text.includes(term))).sort((a,b)=>rank(a)-rank(b)||a.position-b.position).map(entry=>entry.record);
}
