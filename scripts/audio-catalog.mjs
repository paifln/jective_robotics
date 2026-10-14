import {z} from 'zod';

// Keep the playback index exact: an extra ID otherwise advertises a missing recording.
export function validateAudioCatalog(entries,value){
 const id=z.string().regex(/^[FL]\d{2}$/);
 const index=z.object({en:z.array(id),ru:z.array(id),kk:z.array(id).length(0)}).strict().parse(value);
 for(const locale of ['en','ru']){
  const expected=entries.filter(e=>e.locale===locale).map(e=>e.id).sort();
  const actual=[...index[locale]].sort();
  if(new Set(actual).size!==actual.length||JSON.stringify(actual)!==JSON.stringify(expected))throw new Error('AUDIO_INDEX_MISMATCH: '+locale);
 }
 for(const entry of entries){
  const voice=entry.locale==='en'?'Microsoft Zira Desktop':'Microsoft Irina Desktop';
  if(entry.voice!==voice)throw new Error('AUDIO_VOICE_LANGUAGE_MISMATCH: '+entry.id+'-'+entry.locale);
 }
 return index;
}
