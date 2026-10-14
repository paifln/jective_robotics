import React,{useEffect,useRef,useState} from 'react';
import type {Locale} from './locale';
import type {CollisionReply} from '../../../packages/content/collision-worker';
import {CollisionReportSchema} from '../../../packages/content/collision-report';
import type {z} from 'zod';
import {collisionExercise} from '../../../packages/content/collision-activity';
import {LearningExercise} from './LearningExercise';
import {words} from './StudentUI';
import {downloadJSON} from './download';
export function CollisionPanel({locale}:{locale:Locale}){
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 const [report,setReport]=useState<z.infer<typeof CollisionReportSchema>|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const worker=useRef<Worker|null>(null),operation=useRef(''),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const stop=()=>{operation.current='';worker.current?.terminate();worker.current=null;if(timer.current)clearTimeout(timer.current);timer.current=null;};
 useEffect(()=>()=>stop(),[]);
 const run=()=>{
  stop();setReport(null);setError('');
  try{
   const id=crypto.randomUUID(),next=new Worker(new URL('./collision.worker.js',location.href),{type:'module'});operation.current=id;worker.current=next;setBusy(true);
   const fail=(message:string)=>{if(operation.current!==id)return;stop();setBusy(false);setError(message);};
   next.onerror=e=>fail(e.message);
   next.onmessage=(event:MessageEvent<CollisionReply>)=>{
    if(operation.current!==id||event.data.operationId!==id)return;stop();setBusy(false);
    if(!event.data.ok){setError(event.data.error);return;}
    const parsed=CollisionReportSchema.safeParse(event.data.report);
    if(parsed.success)setReport(parsed.data);else setError(w('Invalid scenario report. Run the tests again.','Некорректный отчёт сценариев. Повтори тесты.','Сценарий есебі жарамсыз. Сынақтарды қайтала.'));
   };
   timer.current=setTimeout(()=>fail(w('Tests timed out. Try again.','Время тестов истекло. Попробуй снова.','Сынақ уақыты бітті. Қайта сына.')),10000);next.postMessage({operationId:id});
  }catch(e){stop();setBusy(false);setError(String(e));}
 };
 const names={wall:w('Wall','Стена','Қабырға'),narrow:w('Narrow passage','Узкий проход','Тар өткел'),range:w('Beyond sensor range','За диапазоном датчика','Сенсор ауқымынан тыс')};
 const yes=(value:boolean)=>value?w('Yes','Да','Иә'):w('No','Нет','Жоқ');
 return <section className="collision-lab"><h3>{w('Find the failure before the robot moves','Найди причину отказа до движения робота','Робот қозғалмай тұрып ақау себебін тап')}</h3>
  <p>{w('Test timed driving against distance-aware stopping in three fixed worlds. Each test calls the simulator 300 times with 20 ms steps while running. Completed programs keep their final state. These are lesson algorithms; your editor code is not executed here.','Сравни движение по времени с остановкой по расстоянию в трёх фиксированных полях. Каждый тест вызывает симулятор 300 раз с шагом 20 мс во время выполнения. Завершённая программа сохраняет последнее состояние. Здесь запускаются алгоритмы урока; код из редактора не выполняется.','Үш тұрақты алаңда уақытпен жүруді қашықтықпен тоқтаумен салыстыр. Әр сынақ симуляторды 300 рет шақырады, орындалу қадамы 20 мс. Аяқталған бағдарлама соңғы күйін сақтайды. Мұнда сабақ алгоритмі жүреді; редактор коды орындалмайды.')}</p>
  <svg className="collision-clearance" viewBox="0 0 420 160" role="img" aria-label={w('The robot is wider than the passage','Робот шире прохода','Робот өткелден кең')}><rect x="190" y="10" width="200" height="50" fill="currentColor" opacity=".25"/><rect x="190" y="100" width="200" height="50" fill="currentColor" opacity=".25"/><circle cx="100" cy="80" r="24" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M126 80h90m-10-6 10 6-10 6" fill="none" stroke="currentColor" strokeWidth="2"/><text x="60" y="130" fill="currentColor">0.24 m</text><text x="260" y="86" fill="currentColor">0.20 m</text></svg>
  <div className="toolbar"><button disabled={busy} onClick={run}>{w('Run scenario tests','Запустить тесты сценариев','Сценарий сынақтарын іске қосу')}</button><button disabled={!busy} onClick={()=>{stop();setBusy(false);}}>{w('Cancel','Отменить','Болдырмау')}</button></div>
  {busy&&<p role="status">{w('Testing…','Проверяем…','Тексерілуде…')}</p>}{error&&<p role="alert">{error}</p>}
  {report&&<><table><caption>{w('Collision anywhere in the trace','Столкновение на любом шаге трассы','Іздің кез келген қадамындағы соқтығысу')}</caption><thead><tr><th>{w('Scenario','Сценарий','Сценарий')}</th><th>{w('Timed driving','По времени','Уақытпен')}</th><th>{w('Checked distance','С проверкой расстояния','Қашықтықты тексеру')}</th></tr></thead><tbody>{(['wall','narrow','range'] as const).map(key=><tr key={key}><th scope="row">{names[key]}</th><td>{yes(report.cases[key].starter.collisionSeen)}</td><td>{yes(report.cases[key].corrected.collisionSeen)}</td></tr>)}</tbody></table>
   <p>{w('The range test contains unavailable readings: ','В тесте диапазона есть недоступные показания: ','Ауқым сынағында қолжетімсіз көрсеткіштер бар: ')}{yes(report.cases.range.corrected.invalidDistanceSeen)}. {w('Invalid starting position rejected: ','Недопустимый старт отклонён: ','Жарамсыз бастау қабылданбады: ')}{yes(report.invalidStart.rejected)}.</p>
   <button onClick={()=>downloadJSON('jective-collision-scenarios.json',report)}>{w('Export complete traces','Скачать полные трассы','Толық іздерді жүктеу')}</button></>}
  <p className="note">{w('A narrow sensor ray does not measure body clearance. Safe stopping in these cases does not prove that every route or a physical robot is safe.','Узкий луч датчика не измеряет зазор для корпуса. Остановка в этих случаях не доказывает безопасность любого маршрута или настоящего робота.','Жіңішке сенсор сәулесі корпус аралығын өлшемейді. Бұл жағдайларда тоқтау барлық жолдың не нақты роботтың қауіпсіздігін дәлелдемейді.')}</p>
  <LearningExercise activity={collisionExercise} locale={locale}/>
 </section>;
}
