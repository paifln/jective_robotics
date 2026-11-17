import React,{useEffect,useRef,useState} from 'react';
import type {Device} from '../../../packages/contracts';
import type {ArduinoCommand,ArduinoConnection} from '../../../packages/contracts/arduino-robot';
import {ArduinoInput,arduinoKeys} from '../../../packages/devices/arduino-input';
import {useLocale} from './locale';
import {words} from './StudentUI';
import {RobotDrivePreview} from './RobotDrivePreview';
import {devicePortLabel} from './device-port-label';
import './arduino-robot.css';

type ControlProps={
 active:boolean;
 connectionChange:(port:string|null)=>void;
 ports:Device[];
 selected:string;
 selectPort:(port:string)=>void;
 scanning:boolean;
};

const directions:Record<string,ArduinoCommand>={F:'F',B:'B',L:'L',R:'R'};

export function ArduinoRobotControl({active,connectionChange,ports,selected,selectPort,scanning}:ControlProps){
 const {locale}=useLocale();const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 const [connection,setConnection]=useState<ArduinoConnection|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[command,setCommand]=useState<ArduinoCommand>('S');
 const session=useRef<ArduinoConnection|null>(null),sequence=useRef(0),input=useRef(new ArduinoInput()),mounted=useRef(true),notify=useRef(connectionChange),transmit=useRef<()=>void>(()=>undefined);
 notify.current=connectionChange;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;input.current.clear();const current=session.current;session.current=null;if(current){notify.current(null);void window.jective.arduinoClose(current.id).catch(()=>undefined);}};},[]);
 useEffect(()=>window.jective.onSerial(event=>{
  const current=session.current;if(!current)return;
  if(event.kind==='status'&&event.text.startsWith('Serial disconnected')&&event.connection?.id===current.id){session.current=null;input.current.clear();setConnection(null);setCommand('S');notify.current(null);}
 }),[]);
 useEffect(()=>{
  const current=connection;if(!current)return;
  let pending=0,live=true,last:ArduinoCommand='S';
  const send=(force=false)=>{
   if(session.current?.id!==current.id)return;
   const next=active&&!busy&&!document.hidden&&document.documentElement.dataset.windowHidden!=='true'?input.current.command:'S';
   if(!force&&next===last&&next==='S')return;
   if(!force&&pending&&next===last)return;
   last=next;setCommand(next);pending++;
   void window.jective.arduinoCommand({sessionId:current.id,sequence:sequence.current++,command:next}).then(result=>{
    if(result.ok||session.current?.id!==current.id)return;
    session.current=null;input.current.clear();notify.current(null);
    if(mounted.current){setConnection(null);setCommand('S');setError(result.error.message);}
    void window.jective.arduinoClose(current.id).catch(()=>undefined);
   }).catch(()=>{
    if(session.current?.id!==current.id)return;
    session.current=null;input.current.clear();notify.current(null);
    if(mounted.current){setConnection(null);setCommand('S');setError('ARDUINO_CONNECTION_FAILED');}
    void window.jective.arduinoClose(current.id).catch(()=>undefined);
   }).finally(()=>{pending--;});
  };
  const stop=()=>{input.current.clear();send(true);};
  const keyDown=(event:KeyboardEvent)=>{
   if(!active||busy||!live||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey)return;
   if(event.target instanceof HTMLElement&&event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
   const key=event.key.length===1?event.key.toLowerCase():event.key;
   if(key===' '||key==='Escape'){event.preventDefault();input.current.stop();send(true);return;}
   if(!arduinoKeys[key])return;
   event.preventDefault();input.current.keyDown(key,event.repeat);send();
  };
  const keyUp=(event:KeyboardEvent)=>{const key=event.key.length===1?event.key.toLowerCase():event.key;if(arduinoKeys[key]){input.current.keyUp(key);send();}};
  const hidden=()=>{if(document.hidden||document.documentElement.dataset.windowHidden==='true')stop();};
  transmit.current=()=>send();
  input.current.clear();send(true);
  window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',hidden);window.addEventListener('jective-window-visibility',hidden);
  const timer=setInterval(()=>send(),100);
  return()=>{live=false;clearInterval(timer);window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('jective-window-visibility',hidden);stop();transmit.current=()=>undefined;};
 },[connection,active,busy]);
 const connect=async()=>{
  if(!active||scanning||busy||!selected||session.current)return;setBusy(true);setError('');
  try{const result=await window.jective.arduinoOpen(selected);if(result.ok){if(!mounted.current){void window.jective.arduinoClose(result.value.id);return;}sequence.current=0;session.current=result.value;setConnection(result.value);notify.current(result.value.port);}else if(mounted.current)setError(result.error.message);}catch{if(mounted.current)setError('ARDUINO_CONNECTION_FAILED');}finally{if(mounted.current)setBusy(false);}
 };
 const disconnect=async()=>{const current=session.current;if(!current)return;setBusy(true);input.current.clear();transmit.current();try{const result=await window.jective.arduinoClose(current.id);if(!result.ok){setError(result.error.message);return;}session.current=null;setConnection(null);setCommand('S');notify.current(null);}catch{setError('ARDUINO_CONNECTION_FAILED');}finally{if(mounted.current)setBusy(false);}};
 const names:Record<ArduinoCommand,string>={F:w('Forward','Вперёд','Алға'),B:w('Backward','Назад','Артқа'),L:w('Left','Влево','Солға'),R:w('Right','Вправо','Оңға'),S:w('Stopped','Остановлен','Тоқтады')};
 const releasePointer=(event:React.PointerEvent<HTMLButtonElement>)=>{
  input.current.pointerUp(event.pointerId);
  transmit.current();
 };
 const direction=(value:ArduinoCommand)=><button type="button" className={'arduino-direction direction-'+value}
  data-direction={value} aria-label={names[value]} aria-pressed={command===value} disabled={!connection||!active||busy}
  onPointerDown={event=>{
   if(event.button!==0)return;
   event.preventDefault();
   event.currentTarget.setPointerCapture(event.pointerId);
   input.current.pointerDown(event.pointerId,value);
   transmit.current();
  }}
  onPointerMove={event=>{
   if(!event.currentTarget.hasPointerCapture(event.pointerId))return;
   const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLButtonElement>('.arduino-direction');
   const next=target&&!target.disabled?directions[target.dataset.direction??'']:undefined;
   input.current.pointerMove(event.pointerId,next??'S');
   transmit.current();
  }}
  onPointerUp={releasePointer} onPointerCancel={releasePointer} onLostPointerCapture={releasePointer}>
  <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21V3m-7 7 7-7 7 7"/></svg></span>
 </button>;
 const portLabel=w('HC-05 COM port','COM-порт HC-05','HC-05 COM порты');
 return <section className="arduino-robot-control" aria-label={w('Arduino robot control','Управление роботом Arduino','Arduino роботын басқару')}>
  <div className="arduino-robot-connection">
   <select aria-label={portLabel} title={portLabel} value={connection?.port??selected} disabled={!!connection||busy||scanning||!active} onChange={event=>selectPort(event.target.value)}>
    <option value="">{words(locale,'Bluetooth · HC-05 COM port','Bluetooth · COM-порт HC-05','Bluetooth · HC-05 COM порты')}</option>
    {connection&&!ports.some(port=>port.path===connection.port)&&<option value={connection.port}>{connection.port}</option>}
    {ports.map(port=><option key={port.path} value={port.path}>{devicePortLabel(port,locale)}</option>)}
   </select>
   {connection
    ?<button disabled={busy} onClick={()=>void disconnect()}>{w('Disconnect','Отключить','Ажырату')}</button>
    :<button disabled={busy||scanning||!selected||!active} onClick={()=>void connect()}>{w('Connect · 9600','Подключить · 9600','Қосу · 9600')}</button>}
  </div>
  {error&&<p className="arduino-robot-error" role="alert">{error}</p>}
  <div className="arduino-drive-controls">
   <RobotDrivePreview command={command} label={w('Command preview','Визуализация команд','Командаларды көрсету')}/>
   <div className="arduino-drive-pad">
    {direction('F')}{direction('L')}
    <button type="button" className="arduino-stop" disabled={!connection} onClick={()=>{input.current.stop();transmit.current();}}><span>STOP</span></button>
    {direction('R')}{direction('B')}
   </div>
  </div>
  <p className="arduino-drive-status" role="status" data-connected={!!connection}><span aria-hidden="true"/>{connection?connection.port+' · '+names[command]:w('Disconnected','Не подключён','Қосылмаған')}</p>
  <p className="arduino-drive-hint">{connection
   ?w('Arrows / WASD · Space / Esc to stop','Стрелки / WASD · Пробел / Esc для остановки','Бағыт пернелері / WASD · Тоқтату үшін бос орын / Esc')
   :w('Pair HC-05 in Windows. Install the controller firmware via USB, then select the HC-05 port and connect.','Сопрягите HC-05 в Windows. Установите прошивку пульта по USB, затем выберите порт HC-05 и подключитесь.','HC-05 құрылғысын Windows жүйесінде жұптастырыңыз. Пульт микробағдарламасын USB арқылы орнатып, HC-05 портын таңдап қосылыңыз.')}</p>
 </section>;
}
