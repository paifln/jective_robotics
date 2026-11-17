import {toMilliseconds} from './time-units';
import React,{useState} from 'react';
import {compareSquareRevision,squareRouteDefaults} from '../../../packages/content/square-route';

export function SquareRoutePanel({locale}:{locale:'en'|'ru'|'kk'}){
 const i=locale==='en'?0:locale==='ru'?1:2;
 const t=(en:string,ru:string,kk:string)=>[en,ru,kk][i]!;
 const [turn,setTurn]=useState('1.18'),[track,setTrack]=useState('0.18'),[offset,setOffset]=useState('0'),[reason,setReason]=useState('');
 const [result,setResult]=useState<ReturnType<typeof compareSquareRevision>|null>(null),[error,setError]=useState('');
 const invalidate=()=>{setResult(null);setError('');};
 const fields=[{label:t('Revised turn (s)','Новый поворот (с)','Жаңа бұрылу (с)'),value:turn,set:setTurn,min:0.4,max:2,step:0.02},{label:t('Track (m)','Колея (м)','Жолтабан (м)'),value:track,set:setTrack,min:.15,max:.25,step:.01},{label:t('Right command offset (%)','Разница правой команды (%)','Оң команда айырмасы (%)'),value:offset,set:setOffset,min:-5,max:5,step:1}];
 const poses=result?[...result.baseline.rows[0]!.trace,...result.revision.rows[0]!.trace].map(state=>state.pose):[];
 const minX=poses.length?Math.min(...poses.map(pose=>pose.x)):0,minY=poses.length?Math.min(...poses.map(pose=>pose.y)):0;
 const width=poses.length?Math.max(...poses.map(pose=>pose.x))-minX:1,height=poses.length?Math.max(...poses.map(pose=>pose.y))-minY:1;
 const scale=Math.min(430/Math.max(width,.01),250/Math.max(height,.01));
 const coordinates=(x:number,y:number)=>[25+(x-minX)*scale,275-(y-minY)*scale];
 const point=(x:number,y:number)=>coordinates(x,y).join(',');
 return <details className="square-route-panel"><summary>{t('Square route calibration lab','Лаборатория квадратного маршрута','Шаршы жолды калибрлеу зертханасы')}</summary>
  <p>{t('Compare four-sided paths. Baseline turn: 1 s; straight time: 1 s; three identical repeats. Track changes geometry. Command offset explicitly changes motor commands. These are simulations, not measured motors.','Сравните четырёхсторонние маршруты. Исходный поворот: 1 с; прямая: 1 с; три одинаковых повтора. Колея меняет геометрию, разница команды явно меняет управление. Это симуляция, а не измерения моторов.','Төрт қабырғалы жолды салыстырыңыз. Бастапқы бұрылу: 1 с; түзу: 1 с; үш бірдей қайталау. Жолтабан геометрияны, команда айырмасы басқаруды өзгертеді. Бұл симуляция, мотор өлшемдері емес.')}</p>
  <div className="toolbar">{fields.map(field=><label key={field.label}>{field.label}<input aria-label={field.label} type="number" min={field.min} max={field.max} step={field.step} value={field.value} onChange={e=>{field.set(e.target.value);invalidate();}}/></label>)}</div>
  <label>{t('Explain your revision (10–2000 characters)','Объясните корректировку (10–2000 символов)','Өзгерісті түсіндіріңіз (10–2000 таңба)')}<textarea aria-label={t('Revision explanation','Объяснение корректировки','Өзгеріс түсіндірмесі')} maxLength={2000} value={reason} onChange={e=>{setReason(e.target.value);invalidate();}}/></label>
  <button onClick={()=>{try{
   if([turn,track,offset].some(value=>value.trim()===''))throw new Error('SQUARE_ROUTE_CONFIG');
   const baseline={...squareRouteDefaults,trackMeters:Number(track),rightCommandOffset:Number(offset)};
   setResult(compareSquareRevision(baseline,{...baseline,turnMs:toMilliseconds(Number(turn))},reason));setError('');
  }catch{setResult(null);setError(t('Check the numeric limits and write an explanation of at least 10 characters.','Проверьте пределы чисел и напишите объяснение длиной минимум 10 символов.','Сан шектерін тексеріп, кемінде 10 таңбалық түсіндірме жазыңыз.'));}}}>{t('Compare square routes','Сравнить квадратные маршруты','Шаршы жолдарды салыстыру')}</button>
  {error&&<p role="alert">{error}</p>}
  {result&&<>
   <p>{t('Blue: baseline. Orange: revision. Cross: start. Inspect the whole path; endpoint closure alone does not prove a square.','Синий: исходный. Оранжевый: изменённый. Крест: старт. Изучите весь путь: возврат к началу сам по себе не доказывает квадрат.','Көк: бастапқы. Қызғылт сары: өзгертілген. Айқыш: бастау. Толық жолды тексеріңіз: бастауға қайту шаршыны дәлелдемейді.')}</p>
   <svg viewBox="0 0 480 300" style={{width:'100%',maxWidth:640,background:'#f5f7ff',borderRadius:12}} role="img" aria-label={t('Baseline and revised square trajectories','Исходная и изменённая траектории квадрата','Бастапқы және өзгертілген шаршы жолдары')}>
    {[result.baseline,result.revision].map((run,index)=><polyline key={index} points={run.rows[0]!.trace.map(state=>point(state.pose.x,state.pose.y)).join(' ')} fill="none" stroke={index?'#c45700':'#211dff'} strokeWidth={3} strokeDasharray={index?'6 3':undefined}/>)}
    {result.revision.rows[0]!.sides.map(side=><g key={side.side} transform={`translate(${point(side.corner.x,side.corner.y)})`}><circle r={4} fill="#c45700"/><text x={6} y={-6} fontSize={12} fill="#111827">{side.side}</text></g>)}
    <g transform={`translate(${point(result.baseline.world.start.x,result.baseline.world.start.y)})`}><path d="M-6 0h12M0 -6v12" stroke="#111827" strokeWidth={2}/></g>
   </svg>
   <div style={{overflowX:'auto'}}><table><thead><tr><th>{t('Trial','Повтор','Қайталау')}</th><th>{t('Baseline error (m)','Исходная ошибка (м)','Бастапқы қате (м)')}</th><th>{t('Revised error (m)','Новая ошибка (м)','Жаңа қате (м)')}</th></tr></thead><tbody>{result.baseline.rows.map((row,index)=><tr key={row.trial}><td>{row.trial}</td><td>{row.endpointErrorMeters.toFixed(6)}</td><td>{result.revision.rows[index]!.endpointErrorMeters.toFixed(6)}</td></tr>)}</tbody></table></div>
   <h5>{t('First trial: individual sides and turns','Первый повтор: стороны и повороты','Бірінші қайталау: қабырғалар мен бұрылулар')}</h5>
   <p>{t('Chord length measures displacement between a side’s endpoints, not travelled arc length. Straight heading change detects curvature. Turn error is measured against π/2 radians.','Длина хорды — расстояние между концами стороны, а не длина пройденной дуги. Изменение направления на прямой показывает искривление. Ошибка поворота отсчитывается от π/2 радиан.','Хорда ұзындығы — қабырға ұштарының арақашықтығы, жүрілген доға ұзындығы емес. Түзудегі бағыт өзгерісі қисықтықты көрсетеді. Бұрылу қатесі π/2 радианнан өлшенеді.')}</p>
   <div style={{overflowX:'auto'}}><table className="square-sides"><thead><tr><th>{t('Side','Сторона','Қабырға')}</th><th>{t('Baseline chord (m)','Исходная хорда (м)','Бастапқы хорда (м)')}</th><th>{t('Revised chord (m)','Новая хорда (м)','Жаңа хорда (м)')}</th><th>{t('Straight drift (rad)','Дрейф на прямой (рад)','Түзудегі ауытқу (рад)')}</th><th>{t('Turn error (rad)','Ошибка поворота (рад)','Бұрылу қатесі (рад)')}</th></tr></thead><tbody>{result.revision.rows[0]!.sides.map((side,index)=><tr key={side.side}><td>{side.side}</td><td>{result.baseline.rows[0]!.sides[index]!.chordMeters.toFixed(6)}</td><td>{side.chordMeters.toFixed(6)}</td><td>{side.straightHeadingChangeRadians.toFixed(6)}</td><td>{side.turnErrorRadians.toFixed(6)}</td></tr>)}</tbody></table></div>
   <p role="status">{t('Simulation only. Identical repeats have zero spread; physical verification not run.','Только симуляция. Одинаковые повторы имеют нулевой разброс; физическая проверка не выполнена.','Тек симуляция. Бірдей қайталау шашырауы нөл; нақты тексеру орындалмады.')}</p>
   <button onClick={()=>{const anchor=document.createElement('a');anchor.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));anchor.download='L24-square-revision.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(anchor.href),1000);}}>{t('Export square comparison JSON','Экспортировать сравнение JSON','Салыстыруды JSON экспорттау')}</button>
  </>}
 </details>;
}
