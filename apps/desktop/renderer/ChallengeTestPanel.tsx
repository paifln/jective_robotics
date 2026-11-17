import {toSeconds,toMilliseconds,secondsText} from './time-units';
import React,{useEffect,useRef,useState} from 'react';
import type {z} from 'zod';
import type {Locale} from './locale';
import {words} from './StudentUI';
import {ChallengeInputsSchema,type ChallengeReply} from '../../../packages/content/challenge-worker';
import {ChallengeReportSchema} from '../../../packages/content/challenge-report';
import type {ChallengeVerdict} from '../../../packages/content/challenge-test';
import {challengeTestExercise} from '../../../packages/content/challenge-test-activity';
import {LearningExercise} from './LearningExercise';
import {downloadJSON} from './download';
type Report=z.infer<typeof ChallengeReportSchema>;
export function ChallengeTestPanel({locale}:{locale:Locale}){
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 const [inputs,setInputs]=useState({timeoutMs:6000,requireGoal:true,forbidCollisions:true}),[reports,setReports]=useState<{moving:Report;stationary:Report}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const worker=useRef<Worker|null>(null),operation=useRef(''),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const stop=()=>{operation.current='';worker.current?.terminate();worker.current=null;if(timer.current)clearTimeout(timer.current);timer.current=null;};useEffect(()=>()=>stop(),[]);
 const edit=(next:typeof inputs)=>{stop();setBusy(false);setReports(null);setError('');setInputs(next);};
 const run=()=>{
  stop();setReports(null);setError('');const parsed=ChallengeInputsSchema.safeParse(inputs);if(!parsed.success){setError(w('Use 0.02–6 s in steps of 0.02 s.','Укажи 0,02–6 с, с шагом 0,02 с.','0,02–6 с, 0.02 с қадамды мән қолдан.'));return;}
  try{const id=crypto.randomUUID(),next=new Worker(new URL('./challenge.worker.js',location.href),{type:'module'});worker.current=next;operation.current=id;setBusy(true);
   const fail=(message:string)=>{if(operation.current!==id)return;stop();setBusy(false);setError(message);};next.onerror=e=>fail(e.message);
   next.onmessage=(event:MessageEvent<ChallengeReply>)=>{if(operation.current!==id||event.data.operationId!==id)return;stop();setBusy(false);if(!event.data.ok){setError(event.data.error);return;}
    const moving=ChallengeReportSchema.safeParse(event.data.reports.moving),stationary=ChallengeReportSchema.safeParse(event.data.reports.stationary);
    if(moving.success&&stationary.success&&JSON.stringify(moving.data.criteria)===JSON.stringify(stationary.data.criteria))setReports({moving:moving.data,stationary:stationary.data});else setError(w('Invalid test evidence.','Некорректные данные проверки.','Тексеру дерегі жарамсыз.'));
   };timer.current=setTimeout(()=>fail(w('Tests timed out. Try again.','Время тестов истекло. Попробуй снова.','Сынақ уақыты бітті. Қайта сына.')),10000);next.postMessage({operationId:id,inputs:parsed.data});
  }catch(e){stop();setBusy(false);setError(String(e));}
 };
 const reasons:Record<ChallengeVerdict,string>={'goal-reached':w('Goal reached','Цель достигнута','Мақсатқа жетті'),collision:w('Collision','Столкновение','Соқтығысу'),'program-error':w('Program error','Ошибка программы','Бағдарлама қатесі'),'completed-without-goal':w('Finished without reaching the goal','Завершено без достижения цели','Мақсатқа жетпей аяқталды'),timeout:w('Goal not reached before deadline','Цель не достигнута в срок','Мерзімде мақсатқа жетпеді'),'duration-passed':w('Time limit reached with no forbidden event','Время истекло без запрещённого события','Тыйым салынған оқиғасыз уақыт бітті'),completed:w('Program completed under the stated rules','Программа завершена по заданным правилам','Бағдарлама берілген ережемен аяқталды')};
 return <section className="challenge-test-lab"><h3>{w('Define the test before running','Задай тест до запуска','Іске қоспай тұрып сынақты анықта')}</h3><p>{w('Both lesson programs start at (0.5, 1) m facing right in the same 3 × 2 m field. The goal centre is (1.25, 1) m with radius 0.1 m. One program drives, the other stays still. Your current editor code is not executed here.','Обе программы урока стартуют в (0,5; 1) м вправо в одном поле 3 × 2 м. Центр цели (1,25; 1) м, радиус 0,1 м. Одна программа едет, другая неподвижна. Текущий код редактора здесь не выполняется.','Екі сабақ бағдарламасы бір 3 × 2 м алаңда (0.5, 1) м нүктесінен оңға қарап бастайды. Мақсат центрі (1.25, 1) м, радиусы 0.1 м. Бір бағдарлама жүреді, екіншісі қозғалмайды. Редактордың қазіргі коды мұнда орындалмайды.')}</p>
  <label className="challenge-deadline">{w('Deadline, s','Срок, с','Мерзім, с')}<input type="number" min="0.02" max="6" step="0.02" value={Number.isNaN(inputs.timeoutMs)?'':toSeconds(inputs.timeoutMs)} onChange={e=>edit({...inputs,timeoutMs:e.target.value===''?NaN:toMilliseconds(Number(e.target.value))})}/></label>
  <label><input type="checkbox" checked={inputs.requireGoal} onChange={e=>edit({...inputs,requireGoal:e.target.checked})}/>{w('Require reaching the goal','Требовать достижения цели','Мақсатқа жетуді талап ету')}</label><label><input type="checkbox" checked={inputs.forbidCollisions} onChange={e=>edit({...inputs,forbidCollisions:e.target.checked})}/>{w('Forbid collisions','Запретить столкновения','Соқтығысуды тыйым салу')}</label>
  <div className="toolbar"><button disabled={busy} onClick={run}>{w('Evaluate both programs','Проверить обе программы','Екі бағдарламаны тексеру')}</button><button disabled={!busy} onClick={()=>{stop();setBusy(false);}}>{w('Cancel','Отменить','Болдырмау')}</button></div>{busy&&<p role="status">{w('Testing…','Проверяем…','Тексерілуде…')}</p>}{error&&<p role="alert">{error}</p>}
  {reports&&<><table><thead><tr><th>{w('Program','Программа','Бағдарлама')}</th><th>{w('Result','Результат','Нәтиже')}</th><th>{w('Reason','Причина','Себеп')}</th><th>{locale==='en'?'s':'с'}</th></tr></thead><tbody>{(['moving','stationary'] as const).map(key=><tr key={key}><th scope="row">{key==='moving'?w('Moving','Движение','Қозғалу'):w('Stationary','Остановка','Тоқтау')}</th><td>{reports[key].passed?w('Pass','Зачёт','Өтті'):w('Fail','Не зачтено','Өтпеді')}</td><td>{reasons[reports[key].reason]}</td><td>{secondsText(reports[key].elapsedMs)}</td></tr>)}</tbody></table><button onClick={()=>downloadJSON('jective-challenge-tests.json',reports)}>{w('Export test reports','Скачать отчёты тестов','Сынақ есептерін жүктеу')}</button></>}
  <p className="note">{w('Evaluation ends at the first decisive result. A goal at the deadline counts; a forbidden collision takes priority. This does not verify subsequent motion or a physical robot.','Проверка завершается при первом решающем результате. Цель в момент срока засчитывается; запрещённое столкновение имеет приоритет. Последующее движение и настоящий робот не проверяются.','Тексеру алғашқы шешуші нәтижеде аяқталады. Мерзімдегі мақсат есептеледі; тыйым салынған соқтығысу басым. Кейінгі қозғалыс пен нақты робот тексерілмейді.')}</p><LearningExercise activity={challengeTestExercise} locale={locale}/>
 </section>;
}
