import React from 'react';
import {useLocale} from './locale';
import {words} from './StudentUI';

export function ArduinoStarter({create,disabled}:{create:(mode:'code'|'blocks'|'python'|'micropython')=>void;disabled:boolean}){
 const {locale}=useLocale();
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 return <>
  <button disabled={disabled} onClick={()=>create('blocks')}>{w('New robot program (Blocks)','Новая программа робота (блоки)','Роботтың жаңа бағдарламасы (блоктар)')}</button>
  <button disabled={disabled} onClick={()=>create('python')}>{w('New Python project for Arduino Uno','Новый проект Python для Arduino Uno','Arduino Uno үшін жаңа Python жобасы')}</button>
  <button disabled={disabled} onClick={()=>create('micropython')}>{w('New MicroPython project for ESP32','Новый проект MicroPython для ESP32','ESP32 үшін жаңа MicroPython жобасы')}</button>
  <button disabled={disabled} onClick={()=>create('code')}>{w('New robot program (C++ / Bluetooth)','Новая программа робота (C++ / Bluetooth)','Роботтың жаңа бағдарламасы (C++ / Bluetooth)')}</button>
 </>;
}
