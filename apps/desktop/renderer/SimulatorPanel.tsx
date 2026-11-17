import './simulation-tools.css';
import {useAppVisibility} from './useAppVisibility';
import {SceneControls} from './SceneControls';
import {WorldDesigner} from './WorldDesigner';
import {WorldFiles} from './WorldFiles';
import {worldNames} from '../../../packages/content/simulation-labs';
import {words} from './StudentUI';
import {drawPixelWorld} from './pixel-world';
import {SensorDashboard} from './SensorDashboard';
import {AnalogPlot} from './AnalogPlot';
import type {FunctionProgram} from '../../../packages/codegen/functions';
import {useLocale} from './locale';
import React,{useEffect,useRef,useState} from 'react';
import {worlds,WorldSchema,RobotStateSchema,type World,type RobotState} from '../../../packages/simulator';
import type {Program} from '../../../packages/codegen';
export function SimulatorPanel({getProgram,highlight,initialWorld,worldChange,projectName}:{projectName?:string;worldChange?:(world:World)=>void;initialWorld?:World;getProgram:()=>Program|FunctionProgram;highlight:(id:string|null)=>void}){
 const foreground=useAppVisibility();
 const {t,locale}=useLocale();const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 const [world,setWorld]=useState<World>(structuredClone(initialWorld??worlds[0]!));const [state,setState]=useState<RobotState|null>(null);const [running,setRunning]=useState(false);const [error,setError]=useState('');const engine=useRef<Worker|null>(null);const history=useRef<RobotState[]>([]);const executedProgram=useRef<Program|FunctionProgram|null>(null);const operation=useRef('');const pending=useRef(false);const canvas=useRef<HTMLCanvasElement>(null);
 const [tool,setTool]=useState<'field'|'create'|'inspect'>('field');
 const tools=[
  {id:'field',label:w('Edit field','Настроить поле','Алаңды баптау')},
  {id:'create',label:w('New field','Создать поле','Алаң жасау')},
  {id:'inspect',label:w('Diagnostics','Диагностика','Диагностика')},
 ] as const;
 const changeWorld=(next:World)=>{const valid=WorldSchema.parse(next);setRunning(false);engine.current?.terminate();engine.current=null;operation.current=crypto.randomUUID();pending.current=false;history.current=[];executedProgram.current=null;setState(null);setError('');highlight(null);setWorld(valid);worldChange?.(valid);};
 const reset=()=>{engine.current?.terminate();engine.current=null;setRunning(false);pending.current=false;history.current=[];executedProgram.current=null;try{const id=crypto.randomUUID();operation.current=id;const worker=new Worker(new URL('./robot.worker.js',location.href),{type:'module'});engine.current=worker;worker.onmessage=(event:MessageEvent<{operationId:string;state?:RobotState;error?:string}>)=>{if(event.data.operationId!==operation.current)return;pending.current=false;if(event.data.error){setError(event.data.error);setRunning(false);return;}const response=RobotStateSchema.safeParse(event.data.state);if(!response.success){setError('SIM_RESPONSE_INVALID');setRunning(false);return;}const s=response.data;history.current.push(s);if(history.current.length>6001)history.current.shift();setState(s);highlight(s.activeBlock);if(s.status==='error'||s.status==='completed'||s.status==='cancelled')setRunning(false);};worker.onerror=e=>{setError(e.message);setRunning(false);pending.current=false;};pending.current=true;const program=structuredClone(getProgram());executedProgram.current=program;worker.postMessage({type:'init',operationId:id,program,world});setError('');highlight(null);return true;}catch(e){setError(String(e));setRunning(false);engine.current?.terminate();engine.current=null;pending.current=false;return false;}};
 const step=()=>{if(!engine.current){reset();return;}if(!pending.current){pending.current=true;engine.current.postMessage({type:'step',operationId:operation.current,ticks:1});}};
 useEffect(()=>()=>engine.current?.terminate(),[]);
 useEffect(()=>{if(!running||!foreground)return;const timer=setInterval(step,20);return()=>clearInterval(timer);},[running,world,foreground]);
 useEffect(()=>{const c=canvas.current;if(c)drawPixelWorld(c,world,state);},[world,state]);
 const collision=history.current.some(sample=>sample.collision);
 const download=()=>{const blob=new Blob([JSON.stringify({schemaVersion:1,origin:'simulation',world,program:executedProgram.current??getProgram(),trace:history.current},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='jective-simulation.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
 return <section className="feature simulator-workspace"><h2>{t("Robot simulator / Симулятор / Симулятор")}</h2><p className="simulation-context"><strong>{projectName}</strong> · {w('Runs the current Studio blocks. Reach the flag without hitting walls. Change your blocks in Studio, then try again.','Выполняет текущие блоки из студии. Дойди до флажка без столкновений. Измени блоки в студии и попробуй снова.','Студиядағы ағымдағы блоктар орындалады. Қабырғаға соқтығыспай жалауға жет. Студияда блоктарды өзгертіп, қайта сына.')}</p><div className="toolbar"><label>{w('Practice area','Поле для практики','Жаттығу алаңы')}<select aria-label="World" value={world.id} onChange={e=>changeWorld(structuredClone(worlds.find(w=>w.id===e.target.value)!))}>{!worlds.some(w=>w.id===world.id)&&<option value={world.id}>{world.id==='L43-student-world'?w('Your practice area','Твоё поле для практики','Сенің жаттығу алаңың'):w('Lesson area','Поле урока','Сабақ алаңы')}</option>}{worlds.map(w=><option key={w.id} value={w.id}>{worldNames[w.id]?.[locale]??w.id}</option>)}</select></label><button className="primary" onClick={()=>{if(reset())setRunning(true);}}>{w('Run','Запустить','Іске қосу')}</button><button onClick={()=>setRunning(false)}>{t("Pause")}</button><button onClick={reset}>{t("Reset")}</button></div>{!!world.buttonEvents?.length&&<p>{t("This scenario changes the button during the run. The checkbox sets its starting value.")}</p>}<div className="simulation-stage"><canvas ref={canvas} width={720} height={540} aria-label="Robot world, measured in metres"/><div className="simulation-readings" aria-label="Simulation readings"><div><span>{t('State')}</span><strong>{state?t(state.status):t('Ready')}</strong></div><div><span>{t('Simulation time')}</span><strong>{state?.timeMs??0}<small> ms</small></strong></div><div><span>{t('Distance')}</span><strong>{state?.distance!=null?state.distance.toFixed(3)+' m':'—'}</strong><small>{state?t(state.distanceStatus):t('Not sampled')}</small></div><div><span>{t('Position')}</span><strong>{(state?.pose??world.start).x.toFixed(2)}, {(state?.pose??world.start).y.toFixed(2)}<small> m</small></strong></div><div><span>{w('Heading','Направление','Бағыт')}</span><strong>{Math.round((state?.pose.heading??world.start.heading)*180/Math.PI)}°</strong></div><div><span>{w('Indicator','Индикатор','Индикатор')}</span><strong>{state?.led?w('On','Включён','Қосулы'):w('Off','Выключен','Өшірулі')}</strong></div></div></div><div className="game-checks" aria-label={t("Game checks")}><div data-result={state?.status==='completed'?'pass':error||state?.status==='error'?'fail':'pending'}><span>{t("Code execution")}</span><strong>{t(state?.status==='completed'?"Passed":error||state?.status==='error'?"Failed":"Pending")}</strong></div><div data-result={collision?'fail':state?.status==='completed'?'pass':'pending'}><span>{t("No collisions")}</span><strong>{t(collision?"Failed":state?.status==='completed'?"Passed":"Pending")}</strong></div><div data-result={state?.goal?'pass':state?.status==='completed'?'fail':'pending'}><span>{t("Reach the finish")}</span><strong>{t(state?.goal?"Passed":state?.status==='completed'?"Failed":"Pending")}</strong></div></div>{error&&<p role="alert" className="simulation-error">{error}</p>}<details className="simulation-tools">
 <summary><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/><path d="M9 5v4m6 1v4m-5 1v4"/></svg>{w('Tools','Инструменты','Құралдар')}</summary>
 <div className="simulation-toolbox">
  <div className="simulation-tool-switch" role="group" aria-label={w('Simulator tools','Инструменты симулятора','Симулятор құралдары')}>
   {tools.map(({id,label})=><button key={id} type="button" aria-pressed={tool===id} onClick={()=>setTool(id)}>{label}</button>)}
  </div>
  <div className="simulation-tool-panel" hidden={tool!=='field'}>
   <SceneControls world={world} locale={locale} apply={changeWorld} embedded/>
   <WorldFiles locale={locale} world={world} apply={changeWorld}/>
  </div>
  <div className="simulation-tool-panel" hidden={tool!=='create'}>
   <WorldDesigner locale={locale} apply={changeWorld} embedded/>
  </div>
  <div className="simulation-tool-panel simulation-controls" hidden={tool!=='inspect'}>
   <div className="toolbar"><label><input type="checkbox" checked={world.inputs?.button??false} onChange={e=>{setRunning(false);engine.current?.terminate();engine.current=null;operation.current=crypto.randomUUID();pending.current=false;history.current=[];executedProgram.current=null;setState(null);setError('');const next={...world,inputs:{button:e.target.checked}};setWorld(next);worldChange?.(next);}}/>{t('Simulated button pressed')}</label><button disabled={!engine.current||state?.status==='cancelled'} onClick={()=>{setRunning(false);engine.current?.postMessage({type:'cancel',operationId:operation.current});}}>{t('Cancel simulation')}</button><button disabled={running} onClick={step}>{t("Step 20 ms")}</button><button disabled={!state} onClick={download}>{t("Export scenario and state")}</button></div>
   <section className="simulation-log">
    <h3>{w('Program messages','Сообщения программы','Бағдарлама хабарлары')}</h3>
    {state?.log.length?<ul>{state.log.map((line,index)=><li key={index}>{line}</li>)}</ul>:<p>{w('No messages yet.','Сообщений пока нет.','Хабарлар әлі жоқ.')}</p>}
   </section>
   <details className="simulation-diagnostics"><summary>{t('Detailed state')}</summary><pre>{error||JSON.stringify(state&&{timeMs:state.timeMs,sound:state.sound,ledDuty:state.ledDuty,ledSecondaryDuty:state.ledSecondaryDuty,pose:state.pose,distance:state.distance,distanceStatus:state.distanceStatus,distanceSource:state.distanceSource,lineLeft:state.lineLeft,lineRight:state.lineRight,collision:state.collision,goal:state.goal,status:state.status,error:state.error,variables:state.variables},null,2)}</pre></details>
  </div>
 </div>
</details>{world.analog&&(world.id.startsWith('L18-')||state?.variables.dashboard_time_ms!==undefined)?<SensorDashboard trace={history.current} referenceVolts={world.analog.referenceVolts} maximumMeters={world.robot?.distanceMax??2}/>:world.analog&&<AnalogPlot trace={history.current} referenceVolts={world.analog.referenceVolts} bits={world.analog.bits}/>}</section>;
}
