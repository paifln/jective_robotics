import React from 'react';
import type {Device} from '../../../packages/contracts';
import {devicePortLabel} from './device-port-label';
import {useLocale} from './locale';
import {words} from './StudentUI';

export type BluetoothPorts = {
 ports:Device[];
 selected:string;
 selectPort:(port:string)=>void;
 scanning:boolean;
 scanFailed:boolean;
 refreshPorts:()=>Promise<string>;
};

export function BluetoothSettings({ports,selected,selectPort,scanning,scanFailed,refreshPorts,connected,busy,disconnect,children}:BluetoothPorts&{
 connected:boolean;
 busy:boolean;
 disconnect:()=>void;
 children:React.ReactNode;
}){
 const {locale}=useLocale();
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 const portLabel=w('HC-05 port','Порт HC-05','HC-05 порты');
 return <div className="bluetooth-settings">
  {!connected&&<p>{ports.length
   ?w('Choose your robot’s HC-05 port. If it is missing, refresh the list.','Выбери порт HC-05 своего робота. Если его нет, обнови список.','Роботыңның HC-05 портын таңда. Ол жоқ болса, тізімді жаңарт.')
   :w('Turn on the robot. Pair HC-05 in Windows, then refresh this list.','Включи робота. Выполни сопряжение с HC-05 в Windows, затем обнови список.','Роботты қос. Windows жүйесінде HC-05 құрылғысымен жұптастыр, содан кейін тізімді жаңарт.')}</p>}
  <div className="bluetooth-actions">
   <label>{portLabel} <select aria-label={portLabel} value={selected} disabled={connected||busy||scanning} onChange={event=>selectPort(event.target.value)}>
    <option value="">{w('Choose a port','Выбери порт','Портты таңда')}</option>
    {ports.map(port=><option key={port.path} value={port.path}>{devicePortLabel(port,locale)}</option>)}
   </select></label>
   <button type="button" disabled={connected||busy||scanning} onClick={()=>void refreshPorts()}>{w('Refresh ports','Обновить порты','Порттарды жаңарту')}</button>
   {connected&&<button type="button" disabled={busy} onClick={disconnect}>{w('Disconnect','Отключить','Ажырату')}</button>}
  </div>
  {scanFailed&&<p role="alert">{w('Refresh the list to look for your robot again.','Обнови список, чтобы снова поискать робота.','Роботты қайта іздеу үшін тізімді жаңарт.')}</p>}
  {connected?<p>{w('Disconnect the robot before installing firmware.','Перед установкой прошивки отключи робота в приложении.','Микробағдарламаны орнатпас бұрын роботты қолданбада ажырат.')}</p>:children}
 </div>;
}
