import React,{useEffect,useRef,useState} from 'react';
import type {Device} from '../../../packages/contracts';
import type {ArduinoCommand,ArduinoConnection} from '../../../packages/contracts/arduino-robot';
import {ArduinoInput,arduinoKeys} from '../../../packages/devices/arduino-input';
import {useLocale} from './locale';
import {words} from './StudentUI';
import {devicePortLabel,preferredWirelessPort} from './device-port-label';
import './arduino-robot.css';

export function ArduinoRobotControl({active,connectionChange}:{active:boolean;connectionChange:(port:string|null)=>void}){
 const {locale}=useLocale();const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 const [ports,setPorts]=useState<Device[]>([]),[selected,setSelected]=useState(''),[connection,setConnection]=useState<ArduinoConnection|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[command,setCommand]=useState<ArduinoCommand>('S');
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
   const next=active&&!document.hidden&&document.documentElement.dataset.windowHidden!=='true'?input.current.command:'S';
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
   if(!active||!live||event.ctrlKey||event.metaKey||event.altKey)return;
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
 },[connection,active]);
 const refresh=async()=>{setBusy(true);try{const result=await window.jective.devices();if(!mounted.current)return;if(result.ok){setPorts(result.value);setSelected(previous=>result.value.some(port=>port.path===previous)?previous:preferredWirelessPort(result.value));setError('');}else setError(result.error.message);}catch{if(mounted.current)setError('PORT_LIST_FAILED');}finally{if(mounted.current)setBusy(false);}};
 useEffect(()=>{void refresh();},[]);
 const connect=async()=>{
  if(!selected||session.current)return;setBusy(true);setError('');
  try{const result=await window.jective.arduinoOpen(selected);if(result.ok){if(!mounted.current){void window.jective.arduinoClose(result.value.id);return;}sequence.current=0;session.current=result.value;setConnection(result.value);notify.current(result.value.port);}else if(mounted.current)setError(result.error.message);}catch{if(mounted.current)setError('ARDUINO_CONNECTION_FAILED');}finally{if(mounted.current)setBusy(false);}
 };
 const disconnect=async()=>{const current=session.current;if(!current)return;setBusy(true);input.current.clear();transmit.current();try{const result=await window.jective.arduinoClose(current.id);if(!result.ok){setError(result.error.message);return;}session.current=null;setConnection(null);setCommand('S');notify.current(null);}catch{setError('ARDUINO_CONNECTION_FAILED');}finally{if(mounted.current)setBusy(false);}};
 const controlSetup=w('For control, upload the “C++ / Bluetooth” project. A blocks program runs on its own after uploading.','Для управления загрузите проект «C++ / Bluetooth». Программа из блоков выполняется самостоятельно после загрузки.','Басқару үшін «C++ / Bluetooth» жобасын жүктеңіз. Блоктар бағдарламасы жүктелгеннен кейін өздігінен орындалады.');
 const names:Record<ArduinoCommand,string>={F:w('Forward','Вперёд','Алға'),B:w('Backward','Назад','Артқа'),L:w('Left','Влево','Солға'),R:w('Right','Вправо','Оңға'),S:w('Stopped','Остановлен','Тоқтады')};
 const direction=(value:ArduinoCommand,symbol:string)=> <button type="button" className={'arduino-direction direction-'+value} aria-label={names[value]} aria-pressed={command===value} disabled={!connection||!active||busy} onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);input.current.pointerDown(event.pointerId,value);transmit.current();}} onPointerUp={event=>{input.current.pointerUp(event.pointerId);transmit.current();}} onPointerCancel={event=>{input.current.pointerUp(event.pointerId);transmit.current();}} onLostPointerCapture={event=>{input.current.pointerUp(event.pointerId);transmit.current();}}>{symbol}</button>;
 return <section className="arduino-robot-control" aria-label={w('Arduino robot control','Управление роботом Arduino','Arduino роботын басқару')}><h2>{w('Arduino robot','Робот Arduino','Arduino роботы')}</h2><p>{controlSetup}</p><div className="toolbar"><label>{w('HC-05 COM port','COM-порт HC-05','HC-05 COM порты')}<select aria-label={w('HC-05 COM port','COM-порт HC-05','HC-05 COM порты')} value={selected} disabled={!!connection||busy} onChange={event=>setSelected(event.target.value)}><option value="">{w('Choose a port','Выберите порт','Порт таңдаңыз')}</option>{ports.map(port=><option key={port.path} value={port.path}>{devicePortLabel(port,locale)}</option>)}</select></label><button disabled={busy||!!connection} onClick={()=>void refresh()}>{w('Refresh ports','Обновить порты','Порттарды жаңарту')}</button><button disabled={busy||!selected||!!connection||!active} onClick={()=>void connect()}>{w('Connect · 9600','Подключить · 9600','Қосу · 9600')}</button><button disabled={busy||!connection} onClick={()=>void disconnect()}>{w('Disconnect','Отключить','Ажырату')}</button></div><p>{w('Pair HC-05 in Windows and choose its outgoing COM port. Close the Python controller before connecting.','Сопрягите HC-05 в Windows и выберите его исходящий COM-порт. Перед подключением закройте Python-пульт.','HC-05 құрылғысын Windows жүйесінде жұптастырып, шығыс COM портын таңдаңыз. Қосар алдында Python пультін жабыңыз.')}</p><div className="arduino-drive-pad">{direction('F','↑')}{direction('L','←')}<button type="button" className="arduino-stop" disabled={!connection} onClick={()=>{input.current.stop();transmit.current();}}>STOP</button>{direction('R','→')}{direction('B','↓')}</div><p className="arduino-drive-status" role="status">{connection?connection.port+' · '+names[command]:w('Disconnected','Не подключён','Қосылмаған')}</p><p>{w('Hold an arrow or W A S D. Release to stop. Space / Esc: STOP.','Удерживайте стрелку или W A S D. Отпускание — стоп. Пробел / Esc: STOP.','Бағыт пернесін немесе W A S D басып тұрыңыз. Жіберу — тоқтау. Бос орын / Esc: STOP.')}</p>{error&&<p role="alert">{error}</p>}</section>;
}
