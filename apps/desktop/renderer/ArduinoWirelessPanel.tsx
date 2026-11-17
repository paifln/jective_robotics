import React,{useEffect,useRef,useState} from 'react';
import type {BuildResult,Device,Project} from '../../../packages/contracts';
import type {WirelessConnection,WirelessProgram,WirelessState} from '../../../packages/contracts/arduino-wireless';
import type {FunctionProgram} from '../../../packages/codegen/functions';
import type {Program} from '../../../packages/codegen';
import {compileArduinoWireless} from '../../../packages/codegen/arduino-wireless';
import {parsePythonProgram,PythonSyntaxError} from '../../../packages/codegen/python';
import {createArduinoWirelessRuntimeProject} from '../../../packages/robots/arduino-wireless';
import {StudentBoard} from './StudentBoard';
import {useLocale} from './locale';
import {words} from './StudentUI';
import {canUseWirelessPort,devicePortLabel,preferredWirelessPort} from './device-port-label';
import './arduino-wireless.css';

const idle:WirelessState={status:'ready',sent:0,total:0};
export function ArduinoWirelessPanel({project,getProgram,connectionChange,connectedPort}:{project:Project;getProgram:()=>Program|FunctionProgram;connectionChange:(port:string|null)=>void;connectedPort:string|null}){
 const {locale}=useLocale();const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 const [ports,setPorts]=useState<Device[]>([]),[selected,setSelected]=useState(''),[connection,setConnection]=useState<WirelessConnection|null>(null),[state,setState]=useState<WirelessState>(idle),[busy,setBusy]=useState(false),[sending,setSending]=useState(false),[error,setError]=useState('');
 const [runtime]=useState(()=>createArduinoWirelessRuntimeProject(crypto.randomUUID()));
 const [build,setBuild]=useState<BuildResult|null>(null),[compileLog,setCompileLog]=useState(''),[compiling,setCompiling]=useState(false),[installOpen,setInstallOpen]=useState(false);
 const mounted=useRef(true),session=useRef<WirelessConnection|null>(null),notify=useRef(connectionChange),transfer=useRef(0),connecting=useRef(false);
 notify.current=connectionChange;
 const failSession=(current:WirelessConnection,code:string)=>{
  if(session.current?.id!==current.id)return;session.current=null;transfer.current++;notify.current(null);
  if(mounted.current){setConnection(null);setSending(false);setState({status:'error',sent:0,total:0,error:code});setError(message(code));}
  void window.jective.wirelessClose(current.id).catch(()=>undefined);
 };
 const message=(code:string)=>{
  if(/STOP_UNCONFIRMED|RECONNECT_REQUIRED/.test(code))return w('The robot did not confirm STOP. Reconnect to HC-05 before sending again.','Робот не подтвердил STOP. Переподключись к HC-05 перед повторной отправкой.','Робот STOP пәрменін растамады. Қайта жібермес бұрын HC-05 құрылғысына қайта қосыл.');
  if(/FIRMWARE|HANDSHAKE|HELLO/.test(code))return w('No reply from the robot. Select the outgoing HC-05 port and check robot power. If the Bluetooth firmware has not been installed, install it by USB below.','Робот не ответил. Выбери исходящий порт HC-05 и проверь питание робота. Если Bluetooth-прошивка ещё не установлена, установи её по USB ниже.','Робот жауап бермеді. HC-05 шығыс портын таңдап, роботтың қуатын тексер. Bluetooth микробағдарламасы орнатылмаса, оны төменде USB арқылы орнат.');
  if(/PORT_BUSY|PORT_OWNED/.test(code))return w('Close the board monitor and Python controller, then reconnect.','Закрой монитор платы и Python-пульт, затем подключись снова.','Тақша мониторын және Python пультін жауып, қайта қосыл.');
  if(/TIMEOUT|EXPIRED|LEASE/.test(code))return w('Connection timed out. The program was stopped. Reconnect and send again.','Связь прервалась. Программа остановлена. Подключись и отправь её заново.','Байланыс үзілді. Бағдарлама тоқтады. Қайта қосылып, бағдарламаны қайта жібер.');
  return code;
 };
 let program:WirelessProgram|null=null,programError='';
 try{
  program=compileArduinoWireless(project.pythonSource===undefined?getProgram():parsePythonProgram(project.pythonSource));
 }catch(cause){
  const issue=cause as {code?:string;instructionKind?:string;message?:string};
  programError=cause instanceof PythonSyntaxError?w('Check the Python command on line ','Проверь команду Python в строке ','Python пәрменін мына жолда тексер: ')+cause.line+'.':issue.code?.startsWith('WIRELESS_')?w('This program cannot be sent over Bluetooth. Supported: motors, stop, waits, indicator, fixed repeats and functions with constant arguments.','Эту программу нельзя отправить по Bluetooth. Поддерживаются моторы, стоп, ожидания, индикатор, повторения с заданным числом и функции с постоянными аргументами.','Бұл бағдарламаны Bluetooth арқылы жіберу мүмкін емес. Моторлар, тоқтау, күту, индикатор, тұрақты қайталау және тұрақты аргументтері бар функциялар қолдау табады.')+' '+(issue.instructionKind??'')+' · '+issue.code:(issue.message??String(cause));
 }
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;transfer.current++;const current=session.current;session.current=null;if(current){notify.current(null);void window.jective.wirelessClose(current.id).catch(()=>undefined);}};},[]);
 useEffect(()=>{
  let live=true;void window.jective.devices().then(result=>{if(!live)return;if(result.ok){setPorts(result.value);setSelected(value=>preferredWirelessPort(result.value,value));}else setError(message(result.error.message));}).catch(()=>{if(live)setError('PORT_LIST_FAILED');});return()=>{live=false;};
 },[]);
 useEffect(()=>window.jective.onSerial(event=>{if(event.kind==='status'&&event.text.startsWith('Serial disconnected')&&event.connection?.id===session.current?.id){session.current=null;transfer.current++;setConnection(null);setState({status:'error',sent:0,total:0,error:'PORT_CLOSED'});setSending(false);notify.current(null);}}),[]);
 useEffect(()=>{
  if(!connection)return;let pending=false,live=true;
  const poll=async()=>{
   if(pending||!live||session.current?.id!==connection.id)return;pending=true;
   try{const result=await window.jective.wirelessKeepalive(connection.id);if(!live||session.current?.id!==connection.id)return;if(result.ok)setState(result.value);else failSession(connection,result.error.message);}catch{if(live)failSession(connection,'WIRELESS_CONNECTION_FAILED');}finally{pending=false;}
  };
  const stop=()=>{transfer.current++;void window.jective.wirelessStop(connection.id).then(result=>{if(!live)return;if(result.ok)setState(result.value);else failSession(connection,result.error.message);}).catch(()=>{if(live)failSession(connection,'WIRELESS_STOP_FAILED');});};
  const hidden=()=>{if(document.hidden||document.documentElement.dataset.windowHidden==='true')stop();};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'||(event.key===' '&&!(event.target instanceof HTMLElement&&event.target.closest('input,select,textarea')))){event.preventDefault();stop();}};
  void poll();const timer=setInterval(()=>void poll(),200);window.addEventListener('blur',stop);window.addEventListener('keydown',escape);document.addEventListener('visibilitychange',hidden);window.addEventListener('jective-window-visibility',hidden);
  return()=>{live=false;clearInterval(timer);window.removeEventListener('blur',stop);window.removeEventListener('keydown',escape);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('jective-window-visibility',hidden);};
 },[connection]);
 const disconnect=async()=>{
  const current=session.current;if(!current)return true;transfer.current++;const result=await window.jective.wirelessClose(current.id);if(!result.ok){if(mounted.current)setError(message(result.error.message));return false;}
  session.current=null;notify.current(null);if(mounted.current){setConnection(null);setState(idle);setSending(false);}return true;
 };
 const connect=async()=>{
  if(!ports.some(port=>port.path===selected&&canUseWirelessPort(port))||connecting.current)return;connecting.current=true;setBusy(true);setError('');
  try{const result=await window.jective.wirelessOpen(selected);if(result.ok){if(!mounted.current){void window.jective.wirelessClose(result.value.id);return;}session.current=result.value;setConnection(result.value);setState(idle);notify.current(result.value.port);}else if(mounted.current)setError(message(result.error.message));}catch{void window.jective.serialClose().catch(()=>undefined);if(mounted.current)setError('WIRELESS_CONNECTION_FAILED');}finally{connecting.current=false;if(mounted.current)setBusy(false);}
 };
 const send=async()=>{
  const current=session.current;if(!current||sending||!program)return;const request=++transfer.current;setSending(true);setError('');
  try{const result=await window.jective.wirelessRun({sessionId:current.id,program});if(!mounted.current||request!==transfer.current||session.current?.id!==current.id)return;if(result.ok)setState(result.value);else failSession(current,result.error.message);}catch{if(mounted.current&&request===transfer.current)failSession(current,'WIRELESS_SEND_FAILED');}finally{if(mounted.current)setSending(false);}
 };
 const stop=async()=>{const current=session.current;if(!current)return;transfer.current++;try{const result=await window.jective.wirelessStop(current.id);if(result.ok)setState(result.value);else failSession(current,result.error.message);}catch{failSession(current,'WIRELESS_STOP_FAILED');}};
 const compileRuntime=async()=>{
  setCompiling(true);setBuild(null);setCompileLog('');try{if(!await disconnect())return;const result=await window.jective.compile(runtime);if(!mounted.current)return;if(result.ok){setBuild(result.value);setCompileLog(result.value.log);}else setCompileLog(result.error.message);}catch(cause){if(mounted.current)setCompileLog(String(cause));}finally{if(mounted.current)setCompiling(false);}
 };
 const stateLabel={ready:w('Ready to send','Готов к отправке','Жіберуге дайын'),uploading:w('Sending','Отправка','Жіберілуде'),running:w('Program running','Программа выполняется','Бағдарлама орындалуда'),stopped:w('Stopped','Остановлено','Тоқтатылды'),completed:w('Program completed','Программа завершена','Бағдарлама аяқталды'),error:w('Program stopped after an error','Программа остановлена из-за ошибки','Қатеге байланысты бағдарлама тоқтады')}[state.status];
 return <section className="arduino-wireless-panel">
  <h2>{w('Run via Bluetooth','Запуск по Bluetooth','Bluetooth арқылы іске қосу')}</h2>
  <p>{w('Install the firmware by USB once. If you install the controller firmware afterwards, reinstall this firmware before running programs over HC-05.','Установи прошивку по USB один раз. Если затем установишь прошивку пульта, перед запуском программ через HC-05 установи эту прошивку снова.','Микробағдарламаны USB арқылы бір рет орнат. Пульт микробағдарламасын орнатсаң, HC-05 арқылы бағдарламаларды іске қосу үшін осы микробағдарламаны қайта орнат.')}</p>
  <p className="note">{w('The Arduino Uno Bluetooth firmware uses the robot wiring shown in the USB installation section.','Прошивка Bluetooth для Arduino Uno использует схему робота, указанную в разделе установки по USB.','Arduino Uno Bluetooth микробағдарламасы USB арқылы орнату бөліміндегі робот сұлбасын қолданады.')}</p>
  <div className="wireless-connect-row"><label>{w('HC-05 port','Порт HC-05','HC-05 порты')}<select aria-label={w('HC-05 port','Порт HC-05','HC-05 порты')} value={selected} disabled={busy||!!connection} onChange={event=>setSelected(event.target.value)}><option value="">{w('Choose outgoing COM port','Выбери исходящий COM-порт','Шығыс COM портын таңда')}</option>{ports.map(port=><option key={port.path} value={port.path} disabled={!canUseWirelessPort(port)}>{devicePortLabel(port,locale)}</option>)}</select></label>
   <button disabled={busy||!!connection} onClick={async()=>{try{const result=await window.jective.devices();if(result.ok){setPorts(result.value);setSelected(value=>preferredWirelessPort(result.value,value));}else setError(message(result.error.message));}catch{setError('PORT_LIST_FAILED');}}}>{w('Refresh ports','Обновить порты','Порттарды жаңарту')}</button>
   <button disabled={busy||compiling||!!connection||!selected} onClick={()=>void connect()}>{busy?w('Connecting…','Подключение…','Қосылуда…'):w('Connect · 9600','Подключить · 9600','Қосу · 9600')}</button>
   <button disabled={!connection||busy} onClick={()=>void disconnect().catch(()=>setError('WIRELESS_CLOSE_FAILED'))}>{w('Disconnect','Отключить','Ажырату')}</button>
  </div>
  <p>{w('Use the port named HC-05. USB ports are for firmware installation below.','Выбери порт с именем HC-05. USB-порт используется для установки прошивки ниже.','HC-05 деп аталған портты таңда. USB порты төменде микробағдарламаны орнату үшін қолданылады.')}</p>
  <p>{w('Close the Python controller before connecting. Keep this window and Bluetooth connection open while the program runs.','Перед подключением закрой Python-пульт. Во время выполнения оставь это окно и Bluetooth-соединение открытыми.','Қосар алдында Python пультін жап. Бағдарлама орындалғанда осы терезені және Bluetooth байланысын ашық ұста.')}</p>
  {programError?<p role="alert">{programError}</p>:<p>{w('Commands','Команд','Командалар')}: {program?.steps.length}/96 · {program?.loopStart===-1?w('Run once','Один запуск','Бір рет орындау'):w('Loop until STOP','Цикл до STOP','STOP басылғанша цикл')}</p>}
  <div className="wireless-run-actions"><button className="primary" disabled={!connection||!program||sending||compiling||busy||state.status==='uploading'||state.status==='running'} onClick={()=>void send()}>{sending?w('Sending…','Отправка…','Жіберілуде…'):w('Send and run','Отправить и запустить','Жіберу және іске қосу')}</button><button className="wireless-stop" disabled={!connection} onClick={()=>void stop()}>STOP</button></div>
  <p className="wireless-state" role="status">{connection?connection.port+' · '+stateLabel:w('Not connected','Не подключён','Қосылмаған')}{state.status==='uploading'?` · ${state.sent}/${state.total}`:''}</p>
  {(error||state.error)&&<p role="alert">{error||message(state.error!)}</p>}
  <p className="note">{w('Programs are kept in robot memory until power is switched off. Send again after restarting.','Программа хранится в памяти робота до отключения питания. После включения отправь её заново.','Бағдарлама қуат өшкенше робот жадында сақталады. Қайта қосқаннан кейін оны қайта жібер.')}</p>
  <details className="wireless-install" open={installOpen} onToggle={event=>setInstallOpen(event.currentTarget.open)}><summary>{w('Install by USB (once)','Установить по USB (один раз)','USB арқылы орнату (бір рет)')}</summary>
   <p>{w('This installs the Bluetooth runtime. After upload, disconnect USB if the robot has its own power and connect to HC-05 above.','Здесь устанавливается прошивка для Bluetooth. После загрузки отключи USB, если у робота отдельное питание, и подключись к HC-05 выше.','Мұнда Bluetooth микробағдарламасы орнатылады. Жүктегеннен кейін роботтың жеке қуаты болса USB кабелін ажыратып, жоғарыда HC-05 құрылғысына қосыл.')}</p>
   {installOpen&&<StudentBoard project={runtime} build={build} compile={compileRuntime} compileLog={compileLog} compiling={compiling||sending} openConnections={()=>setCompileLog('HC-05: D2/D3 · DRV8833: D4/D5/D6/D9/D10')} connectionChange={connectionChange} connectedPort={connectedPort}/>}
  </details>
 </section>;
}
