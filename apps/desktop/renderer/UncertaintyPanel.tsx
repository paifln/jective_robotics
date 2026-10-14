import React,{useEffect,useRef,useState} from 'react';
import type {z} from 'zod';
import type {Locale} from './locale';
import {words} from './StudentUI';
import {UncertaintyInputSchema} from '../../../packages/content/sensor-uncertainty';
import {UncertaintyReportSchema} from '../../../packages/content/uncertainty-report';
import type {UncertaintyReply} from '../../../packages/content/uncertainty-worker';
import {uncertaintyExercise} from '../../../packages/content/uncertainty-activity';
import {LearningExercise} from './LearningExercise';
import {EnteredMeasurements} from './EnteredMeasurements';
import {downloadJSON} from './download';
export function UncertaintyPanel({locale}:{locale:Locale}){
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 const [inputs,setInputs]=useState({seed:23,samples:100,noiseMeters:.05}),[report,setReport]=useState<z.infer<typeof UncertaintyReportSchema>|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const worker=useRef<Worker|null>(null),operation=useRef(''),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const stop=()=>{operation.current='';worker.current?.terminate();worker.current=null;if(timer.current)clearTimeout(timer.current);timer.current=null;};useEffect(()=>()=>stop(),[]);
 const run=()=>{
  stop();setReport(null);setError('');const parsed=UncertaintyInputSchema.safeParse(inputs);
  if(!parsed.success){setError(w('Use a whole seed, 1–300 samples and noise 0–0.2 m.','Укажи целый seed, 1–300 измерений и шум 0–0,2 м.','Бүтін seed, 1–300 өлшем және 0–0.2 м шу қолдан.'));return;}
  try{const id=crypto.randomUUID(),next=new Worker(new URL('./uncertainty.worker.js',location.href),{type:'module'});worker.current=next;operation.current=id;setBusy(true);
   const fail=(message:string)=>{if(operation.current!==id)return;stop();setBusy(false);setError(message);};next.onerror=e=>fail(e.message);
   next.onmessage=(event:MessageEvent<UncertaintyReply>)=>{if(operation.current!==id||event.data.operationId!==id)return;stop();setBusy(false);if(!event.data.ok){setError(event.data.error);return;}const checked=UncertaintyReportSchema.safeParse(event.data.report);if(checked.success)setReport(checked.data);else setError(w('Invalid measurement report.','Некорректный отчёт измерений.','Өлшем есебі жарамсыз.'));};
   timer.current=setTimeout(()=>fail(w('Measurement timed out. Try again.','Время измерения истекло. Попробуй снова.','Өлшеу уақыты бітті. Қайта сына.')),10000);next.postMessage({operationId:id,inputs:parsed.data});
  }catch(e){stop();setBusy(false);setError(String(e));}
 };
 return <section className="uncertainty-lab"><h3>{w('Measure the spread','Измерь разброс','Шашырауды өлше')}</h3>
  <p>{w('The simulated robot remains still, 1.5 m from a wall. Collect seeded readings, repeat the experiment and compare zero noise. This runs the lesson model, not editor code or a physical sensor.','Виртуальный робот неподвижен, до стены 1,5 м. Собери показания с seed, повтори опыт и сравни с нулевым шумом. Работает модель урока, а не код редактора или настоящий датчик.','Виртуалды робот қозғалмайды, қабырғаға дейін 1.5 м. Seed бар көрсеткіштерді жина, тәжірибені қайтала және нөл шумен салыстыр. Сабақ моделі жүреді, редактор коды не нақты сенсор емес.')}</p>
  <div className="world-designer-fields">{(['seed','samples','noiseMeters'] as const).map((key,i)=><label key={key}>{[w('Seed','Seed','Seed'),w('Samples','Измерения','Өлшемдер'),w('Noise, m','Шум, м','Шу, м')][i]}<input type="number" value={Number.isNaN(inputs[key])?'':inputs[key]} onChange={e=>{stop();setBusy(false);setReport(null);setError('');setInputs(old=>({...old,[key]:e.target.value===''?NaN:Number(e.target.value)}));}}/></label>)}</div>
  <div className="toolbar"><button disabled={busy} onClick={run}>{w('Collect simulated readings','Собрать показания модели','Модель көрсеткіштерін жинау')}</button><button disabled={!busy} onClick={()=>{stop();setBusy(false);}}>{w('Cancel','Отменить','Болдырмау')}</button></div>
  {busy&&<p role="status">{w('Collecting…','Собираем…','Жиналуда…')}</p>}{error&&<p role="alert">{error}</p>}
  {report&&<><dl><dt>{w('Valid / unavailable','Достоверные / недоступные','Жарамды / қолжетімсіз')}</dt><dd>{report.summary.validCount} / {report.summary.missingCount}</dd><dt>{w('Mean, m','Среднее, м','Орташа, м')}</dt><dd>{report.summary.mean?.toFixed(4)??'—'}</dd><dt>{w('Span, m','Размах, м','Ауқым, м')}</dt><dd>{report.summary.span?.toFixed(4)??'—'}</dd><dt>{w('Mean minus reference, m','Среднее минус опорное, м','Орташа минус тірек, м')}</dt><dd>{report.summary.meanError?.toFixed(4)??'—'}</dd></dl><button onClick={()=>downloadJSON('jective-sensor-uncertainty.json',report)}>{w('Export model measurements','Скачать измерения модели','Модель өлшемдерін жүктеу')}</button></>}
  <p className="note">{w('The span describes these samples, not a guaranteed error bound. A reference distance can itself be uncertain. Matching model runs does not verify physical calibration.','Размах описывает эти измерения, а не гарантированный предел ошибки. Опорное расстояние само может быть неточным. Совпадение запусков модели не подтверждает физическую калибровку.','Ауқым осы өлшемдерді сипаттайды, кепілді қате шегі емес. Тірек қашықтықтың өзі дәл болмауы мүмкін. Модель іске қосуларының сәйкестігі нақты калибрлеуді растамайды.')}</p>
  <EnteredMeasurements locale={locale}/><LearningExercise activity={uncertaintyExercise} locale={locale}/>
 </section>;
}
