import React,{useState} from 'react';
import type {Locale} from './locale';
import {words} from './StudentUI';
import {parseMeasurementEntry} from '../../../packages/content/measurement-entry';
import {downloadJSON} from './download';
export function EnteredMeasurements({locale}:{locale:Locale}){
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 const [reference,setReference]=useState(''),[text,setText]=useState(''),[report,setReport]=useState<ReturnType<typeof parseMeasurementEntry>|null>(null),[error,setError]=useState('');
 const clear=()=>{setReport(null);setError('');};
 return <details className="entered-measurements"><summary>{w('Analyze your own measurements','Разобрать свои измерения','Өз өлшемдеріңді талдау')}</summary>
  <p>{w('Enter readings in metres, one per line. Use ? for an unavailable reading. Enter your measured reference distance separately. These are values you enter; the app has not collected or verified them from a board.','Вводи показания в метрах, по одному на строку. Недоступное показание обозначь ?. Отдельно укажи измеренное опорное расстояние. Это введённые тобой значения; приложение не получало и не проверяло их на плате.','Көрсеткішті метрмен, әр жолға біреуін енгіз. Қолжетімсіз көрсеткіш үшін ? қолдан. Өлшенген тірек қашықтықты бөлек енгіз. Бұлар сен енгізген мәндер; қолданба оларды тақшадан жинаған не тексерген жоқ.')}</p>
  <label>{w('Reference distance, m','Опорное расстояние, м','Тірек қашықтық, м')}<input type="number" min="0" max="5" step="any" value={reference} onChange={e=>{clear();setReference(e.target.value);}}/></label>
  <label>{w('Readings, m — one per line','Показания, м — по одному на строку','Көрсеткіш, м — әр жолға біреу')}<textarea rows={6} maxLength={12000} value={text} onChange={e=>{clear();setText(e.target.value);}}/></label>
  <button onClick={()=>{setReport(null);try{if(reference.trim()==='')throw new Error('REFERENCE_REQUIRED');setReport(parseMeasurementEntry(text,Number(reference)));setError('');}catch{setError(w('Check the reference (0–5 m), 1–300 lines and decimal readings or ?. Blank lines and units in the readings are not accepted.','Проверь опорное расстояние (0–5 м), 1–300 строк и десятичные показания либо ?. Пустые строки и единицы в показаниях не принимаются.','Тірек қашықтықты (0–5 м), 1–300 жол және ондық көрсеткіш не ? тексер. Бос жолдар мен көрсеткіштегі бірліктер қабылданбайды.'));}}}>{w('Analyze entered readings','Разобрать введённые показания','Енгізілген көрсеткіштерді талдау')}</button>
  {error&&<p role="alert">{error}</p>}{report&&<><dl><dt>{w('Valid / unavailable','Достоверные / недоступные','Жарамды / қолжетімсіз')}</dt><dd>{report.summary.validCount} / {report.summary.missingCount}</dd><dt>{w('Mean, m','Среднее, м','Орташа, м')}</dt><dd>{report.summary.mean?.toFixed(4)??'—'}</dd><dt>{w('Span, m','Размах, м','Ауқым, м')}</dt><dd>{report.summary.span?.toFixed(4)??'—'}</dd><dt>{w('Mean minus reference, m','Среднее минус опорное, м','Орташа минус тірек, м')}</dt><dd>{report.summary.meanError?.toFixed(4)??'—'}</dd></dl><button onClick={()=>downloadJSON('jective-entered-measurements.json',report)}>{w('Export entered measurements','Скачать введённые измерения','Енгізілген өлшемдерді жүктеу')}</button></>}
 </details>;
}
