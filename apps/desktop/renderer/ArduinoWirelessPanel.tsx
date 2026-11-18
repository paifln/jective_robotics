import React,{useEffect,useRef,useState} from 'react';
import type {BuildResult,Project} from '../../../packages/contracts';
import type {WirelessConnection,WirelessProgram,WirelessState} from '../../../packages/contracts/arduino-wireless';
import type {FunctionProgram} from '../../../packages/codegen/functions';
import type {Program} from '../../../packages/codegen';
import {compileArduinoWireless} from '../../../packages/codegen/arduino-wireless';
import {parsePythonProgram,PythonSyntaxError} from '../../../packages/codegen/python';
import {createArduinoWirelessRuntimeProject} from '../../../packages/robots/arduino-wireless';
import {StudentBoard} from './StudentBoard';
import {useLocale} from './locale';
import {words} from './StudentUI';
import {BluetoothSettings,type BluetoothPorts} from './BluetoothSettings';
import {bluetoothErrorText,type BluetoothAction} from './bluetooth-error-text';
import './arduino-wireless.css';

const idle:WirelessState={status:'ready',sent:0,total:0};
export function ArduinoWirelessPanel({project,getProgram,connectionChange,connectedPort,ports,disabled,prepareConnection}:{project:Project;getProgram:()=>Program|FunctionProgram;connectionChange:(port:string|null)=>void;connectedPort:string|null;ports:BluetoothPorts;disabled:boolean;prepareConnection:()=>Promise<boolean>}){
 const {locale}=useLocale();const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 const [connection,setConnection]=useState<WirelessConnection|null>(null),[state,setState]=useState<WirelessState>(idle),[busy,setBusy]=useState(false),[sending,setSending]=useState(false),[error,setError]=useState('');
 const [runtime]=useState(()=>createArduinoWirelessRuntimeProject(crypto.randomUUID()));
 const [build,setBuild]=useState<BuildResult|null>(null),[compileLog,setCompileLog]=useState(''),[compiling,setCompiling]=useState(false),[installOpen,setInstallOpen]=useState(false);
 const [settingsOpen,setSettingsOpen]=useState(false);
 const mounted=useRef(true),session=useRef<WirelessConnection|null>(null),notify=useRef(connectionChange),transfer=useRef(0),connecting=useRef(false);
 notify.current=connectionChange;
 const showError=(action:BluetoothAction,detail?:string)=>setError(bluetoothErrorText(locale,action,detail));
 const failSession=(current:WirelessConnection,action:BluetoothAction,detail?:string)=>{
  if(session.current?.id!==current.id)return;session.current=null;transfer.current++;notify.current(null);
  if(mounted.current){setConnection(null);setSending(false);setState(idle);showError(action,detail);}
  void window.jective.wirelessClose(current.id).catch(()=>undefined);
 };
 const getWirelessProgram=():WirelessProgram|null=>{
  try{
   return compileArduinoWireless(project.pythonSource===undefined?getProgram():parsePythonProgram(project.pythonSource));
  }catch(cause){
   const code=(cause as {code?:string}|null)?.code;
   if(cause instanceof PythonSyntaxError)
    setError(w(`Check line ${cause.line} of your Python program.`,`Проверь строку ${cause.line} программы на Python.`,`Python бағдарламасының ${cause.line}-жолын тексер.`));
   else if(code==='WIRELESS_EMPTY_PROGRAM')
    setError(w('Add a command before running the program.','Добавь команду перед запуском программы.','Бағдарламаны іске қоспас бұрын пәрмен қос.'));
   else if(code==='WIRELESS_MAX_STEPS'||code==='WIRELESS_EXPANSION_LIMIT'||code==='WIRELESS_PROGRAM_LIMIT')
    setError(w('The program is too long to send over Bluetooth.','Программа слишком длинная для отправки по Bluetooth.','Бағдарлама Bluetooth арқылы жіберу үшін тым ұзын.'));
   else if(code?.startsWith('WIRELESS_'))
    setError(w('The program contains a command that cannot run over Bluetooth.','В программе есть команда, которую нельзя запустить по Bluetooth.','Бағдарламада Bluetooth арқылы орындалмайтын пәрмен бар.'));
   else
    setError(w('Check the commands in your program and try again.','Проверь команды в программе и попробуй снова.','Бағдарламадағы пәрмендерді тексеріп, қайталап көр.'));
   return null;
  }
 };
 useEffect(()=>{
  const cancelStart=()=>{transfer.current++;};
  const stopHidden=()=>{if(document.hidden||document.documentElement.dataset.windowHidden==='true')cancelStart();};
  const stopKey=(event:KeyboardEvent)=>{if(event.key==='Escape')cancelStart();};
  window.addEventListener('blur',cancelStart);
  window.addEventListener('keydown',stopKey);
  document.addEventListener('visibilitychange',stopHidden);
  window.addEventListener('jective-window-visibility',stopHidden);
  return()=>{window.removeEventListener('blur',cancelStart);window.removeEventListener('keydown',stopKey);document.removeEventListener('visibilitychange',stopHidden);window.removeEventListener('jective-window-visibility',stopHidden);};
 },[]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;transfer.current++;const current=session.current;session.current=null;if(current){notify.current(null);void window.jective.wirelessClose(current.id).catch(()=>undefined);}};},[]);
 useEffect(()=>window.jective.onSerial(event=>{if(event.kind==='status'&&event.text.startsWith('Serial disconnected')&&session.current&&event.connection?.id===session.current.id){session.current=null;transfer.current++;setConnection(null);setState(idle);showError('connection');setSending(false);notify.current(null);}}),[]);
 useEffect(()=>{
  if(!connection)return;let pending=false,live=true;
  const poll=async()=>{
   if(pending||!live||session.current?.id!==connection.id)return;pending=true;
   try{const result=await window.jective.wirelessKeepalive(connection.id);if(!live||session.current?.id!==connection.id)return;if(result.ok)setState(result.value);else failSession(connection,'connection',result.error.message);}catch{if(live)failSession(connection,'connection');}finally{pending=false;}
  };
  const stop=()=>{transfer.current++;void window.jective.wirelessStop(connection.id).then(result=>{if(!live)return;if(result.ok)setState(result.value);else failSession(connection,'stop',result.error.message);}).catch(()=>{if(live)failSession(connection,'stop');});};
  const hidden=()=>{if(document.hidden||document.documentElement.dataset.windowHidden==='true')stop();};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'||(event.key===' '&&!(event.target instanceof HTMLElement&&event.target.closest('input,select,textarea,button,summary,[contenteditable=true]')))){event.preventDefault();stop();}};
  void poll();const timer=setInterval(()=>void poll(),200);window.addEventListener('blur',stop);window.addEventListener('keydown',escape);document.addEventListener('visibilitychange',hidden);window.addEventListener('jective-window-visibility',hidden);
  return()=>{live=false;clearInterval(timer);window.removeEventListener('blur',stop);window.removeEventListener('keydown',escape);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('jective-window-visibility',hidden);};
 },[connection]);
 const disconnect=async()=>{
  const current=session.current;if(!current)return true;transfer.current++;const result=await window.jective.wirelessClose(current.id);if(!result.ok){if(mounted.current)showError('disconnect',result.error.message);return false;}
  session.current=null;notify.current(null);if(mounted.current){setConnection(null);setState(idle);setSending(false);}return true;
 };
 const run=async()=>{
  if(disabled||compiling||connecting.current||sending||state.status==='running'||state.status==='uploading')return;
  setError('');
  const program=getWirelessProgram();
  if(!program)return;
  if(ports.scanning)return;
  connecting.current=true;
  const request=++transfer.current;
  const active=()=>mounted.current&&request===transfer.current&&!document.hidden&&document.documentElement.dataset.windowHidden!=='true';
  let current=session.current;
  try{
   if(!current){
    setBusy(true);
    const port=ports.selected||await ports.refreshPorts();
    if(!active())return;
    if(!port){setSettingsOpen(true);return;}
    if(!await prepareConnection()||!active())return;
    const opened=await window.jective.wirelessOpen(port);
    if(!opened.ok){
     if(active()){showError('connect',opened.error.message);if(/FIRMWARE|HANDSHAKE|HELLO/.test(opened.error.message))setSettingsOpen(true);}
     return;
    }
    if(!active()){await window.jective.wirelessClose(opened.value.id);return;}
    current=opened.value;
    session.current=current;
    setConnection(current);
    setState(idle);
    notify.current(current.port);
   }
   setBusy(false);setSettingsOpen(false);setSending(true);
   const result=await window.jective.wirelessRun({sessionId:current.id,program});
   if(!active()||session.current?.id!==current.id)return;
   if(result.ok)setState(result.value);else failSession(current,'send',result.error.message);
  }catch{
   if(active()){
    if(current)failSession(current,'send');
    else showError('connect');
   }
  }finally{
   connecting.current=false;
   if(mounted.current){setBusy(false);setSending(false);}
  }
 };
 const stop=async()=>{transfer.current++;const current=session.current;if(!current)return;try{const result=await window.jective.wirelessStop(current.id);if(result.ok)setState(result.value);else failSession(current,'stop',result.error.message);}catch{failSession(current,'stop');}};
 const compileRuntime=async()=>{
  setCompiling(true);setBuild(null);setCompileLog('');try{if(!await disconnect())return;const result=await window.jective.compile(runtime);if(!mounted.current)return;if(result.ok){setBuild(result.value);setCompileLog(result.value.log);}else setCompileLog(result.error.message);}catch(cause){if(mounted.current)setCompileLog(String(cause));}finally{if(mounted.current)setCompiling(false);}
 };
 const stateLabel={ready:w('Ready to send','Готов к отправке','Жіберуге дайын'),uploading:w('Sending','Отправка','Жіберілуде'),running:w('Program running','Программа выполняется','Бағдарлама орындалуда'),stopped:w('Stopped','Остановлено','Тоқтатылды'),completed:w('Program completed','Программа завершена','Бағдарлама аяқталды'),error:w('Program stopped after an error','Программа остановлена из-за ошибки','Қатеге байланысты бағдарлама тоқтады')}[state.status];
 const stoppable=busy||sending||state.status==='uploading'||state.status==='running';
 const runLabel=w('Run via Bluetooth','Запустить по Bluetooth','Bluetooth арқылы іске қосу');
 const setupLabel=w('Robot setup','Настройка робота','Робот баптаулары');
 return <section className="arduino-wireless-panel" id="studio-bluetooth">
  <div className="bluetooth-actions">
   {stoppable
    ?<button type="button" className="wireless-stop" onClick={()=>void stop()}>STOP</button>
    :<button type="button" className="primary bluetooth-run-launch" disabled={disabled||compiling||ports.scanning} onClick={()=>void run()}>{runLabel}</button>}
   {!error&&!state.error&&(busy||sending||connection)&&<p className="wireless-state" role="status">{busy?w('Connecting to robot…','Подключаем робота…','Роботқа қосылуда…'):state.status==='uploading'?`${stateLabel} · ${state.sent}/${state.total}`:sending&&state.status==='ready'?w('Sending…','Отправляем…','Жіберілуде…'):stateLabel}</p>}
   <button type="button" className="bluetooth-setup" aria-expanded={settingsOpen} onClick={()=>setSettingsOpen(value=>!value)}>{setupLabel}</button>
  </div>
  {(error||state.error)&&<p role="alert">{error||bluetoothErrorText(locale,'send',state.error)}</p>}
  {settingsOpen&&<BluetoothSettings {...ports} connected={!!connection} busy={busy||disabled||compiling} disconnect={()=>void disconnect().catch(()=>showError('disconnect'))}>
  <details className="wireless-install" open={installOpen} onToggle={event=>setInstallOpen(event.currentTarget.open)}><summary>{w('Install by USB (once)','Установить по USB (один раз)','USB арқылы орнату (бір рет)')}</summary>
   <p>{w('This installs the Bluetooth runtime. After upload, disconnect USB if the robot has its own power and connect to HC-05 above.','Здесь устанавливается прошивка для Bluetooth. После загрузки отключи USB, если у робота отдельное питание, и подключись к HC-05 выше.','Мұнда Bluetooth микробағдарламасы орнатылады. Жүктегеннен кейін роботтың жеке қуаты болса USB кабелін ажыратып, жоғарыда HC-05 құрылғысына қосыл.')}</p>
   {installOpen&&!busy&&<StudentBoard project={runtime} build={build} compile={compileRuntime} compileLog={compileLog} compiling={compiling||sending} openConnections={()=>setCompileLog('HC-05: D2/D3 · DRV8833: D4/D5/D6/D9/D10')} connectionChange={connectionChange} connectedPort={connectedPort}/>}
  </details>
  </BluetoothSettings>}
 </section>;
}
