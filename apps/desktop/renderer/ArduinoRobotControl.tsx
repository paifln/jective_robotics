import React,{useEffect,useRef,useState} from 'react';
import type {ArduinoCommand,ArduinoConnection} from '../../../packages/contracts/arduino-robot';
import {ArduinoInput,arduinoKeys} from '../../../packages/devices/arduino-input';
import {useLocale} from './locale';
import {words} from './StudentUI';
import {RobotDrivePreview} from './RobotDrivePreview';
import {BluetoothSettings,type BluetoothPorts} from './BluetoothSettings';
import {bluetoothErrorText,type BluetoothAction} from './bluetooth-error-text';
import './arduino-robot.css';

type ControlProps={
 active:boolean;
 connectionChange:(port:string|null)=>void;
 ports:BluetoothPorts;
 setup:React.ReactNode;
 prepareConnection:()=>Promise<boolean>;
};

const directions:Record<string,ArduinoCommand>={F:'F',B:'B',L:'L',R:'R'};

export function ArduinoRobotControl({active,connectionChange,ports,setup,prepareConnection}:ControlProps){
 const {locale}=useLocale();const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 const [connection,setConnection]=useState<ArduinoConnection|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[command,setCommand]=useState<ArduinoCommand>('S');
 const [settingsOpen,setSettingsOpen]=useState(false);
 const session=useRef<ArduinoConnection|null>(null),sequence=useRef(0),input=useRef(new ArduinoInput()),mounted=useRef(true),connecting=useRef(false),notify=useRef(connectionChange),transmit=useRef<()=>void>(()=>undefined);
 notify.current=connectionChange;
 const showError=(action:BluetoothAction,detail?:string)=>setError(bluetoothErrorText(locale,action,detail));
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;input.current.clear();const current=session.current;session.current=null;if(current){notify.current(null);void window.jective.arduinoClose(current.id).catch(()=>undefined);}};},[]);
 useEffect(()=>window.jective.onSerial(event=>{
  const current=session.current;if(!current)return;
  if(event.kind==='status'&&event.text.startsWith('Serial disconnected')&&event.connection?.id===current.id){session.current=null;input.current.clear();setConnection(null);setCommand('S');showError('connection');notify.current(null);}
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
    if(mounted.current){setConnection(null);setCommand('S');showError(next==='S'?'stop':'connection',result.error.message);}
    void window.jective.arduinoClose(current.id).catch(()=>undefined);
   }).catch(()=>{
    if(session.current?.id!==current.id)return;
    session.current=null;input.current.clear();notify.current(null);
    if(mounted.current){setConnection(null);setCommand('S');showError(next==='S'?'stop':'connection');}
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
  if(!active||ports.scanning||connecting.current||session.current)return;
  connecting.current=true;setBusy(true);setError('');
  try{const port=ports.selected||await ports.refreshPorts();if(!mounted.current)return;if(!port){setSettingsOpen(true);return;}if(!await prepareConnection()||!mounted.current)return;const result=await window.jective.arduinoOpen(port);if(result.ok){if(!mounted.current){void window.jective.arduinoClose(result.value.id);return;}sequence.current=0;session.current=result.value;setConnection(result.value);setSettingsOpen(false);notify.current(result.value.port);}else if(mounted.current)showError('connect',result.error.message);}catch{if(mounted.current)showError('connect');}finally{connecting.current=false;if(mounted.current)setBusy(false);}
 };
 const disconnect=async()=>{const current=session.current;if(!current)return;setBusy(true);input.current.clear();transmit.current();try{const result=await window.jective.arduinoClose(current.id);if(!result.ok){showError('disconnect',result.error.message);return;}session.current=null;setConnection(null);setCommand('S');notify.current(null);}catch{showError('disconnect');}finally{if(mounted.current)setBusy(false);}};
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
 return <section className="arduino-robot-control" aria-label={w('Arduino robot control','Управление роботом Arduino','Arduino роботын басқару')}>
  {!connection&&<>
   <p className="robot-connect-hint">{w('Turn on the robot to start driving.','Включи робота, чтобы начать управление.','Басқаруды бастау үшін роботты қос.')}</p>
   <button type="button" className="primary robot-connect" disabled={busy||ports.scanning||!active} onClick={()=>void connect()}>{busy?w('Connecting…','Подключение…','Қосылуда…'):w('Connect robot','Подключить робота','Роботты қосу')}</button>
  </>}
  {error&&<p className="arduino-robot-error" role="alert">{error}</p>}
  {connection&&<>
  <div className="arduino-drive-controls">
   <RobotDrivePreview command={command} label={w('Command preview','Визуализация команд','Командаларды көрсету')}/>
   <div className="arduino-drive-pad">
    {direction('F')}{direction('L')}
    <button type="button" className="arduino-stop" disabled={!connection} onClick={()=>{input.current.stop();transmit.current();}}><span>STOP</span></button>
    {direction('R')}{direction('B')}
   </div>
  </div>
   <p className="arduino-drive-status" role="status" data-connected="true"><span aria-hidden="true"/>{w('Connected','Подключён','Қосылған')+' · '+names[command]}</p>
   <p className="arduino-drive-hint">{w('Hold an arrow to drive · Space / Esc to stop','Удерживай стрелку для движения · Пробел / Esc для остановки','Жүру үшін бағыт пернесін басып тұр · Тоқтату үшін бос орын / Esc')}</p>
  </>}
  <button type="button" className="bluetooth-setup" aria-expanded={settingsOpen} onClick={()=>setSettingsOpen(value=>!value)}>{w('Robot setup','Настройка робота','Робот баптаулары')}</button>
  {settingsOpen&&<BluetoothSettings {...ports} connected={!!connection} busy={busy||!active} disconnect={()=>void disconnect()}>{setup}</BluetoothSettings>}
 </section>;
}
