import React from 'react';
import {useLocale} from './locale';
import {words} from './StudentUI';

export function ArduinoStarter({create,disabled}:{create:(mode:'code'|'blocks')=>void;disabled:boolean}){
 const {locale}=useLocale();
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 return <>
  <button disabled={disabled} onClick={()=>create('blocks')}>{w('New robot program (Blocks)','Новая программа робота (блоки)','Роботтың жаңа бағдарламасы (блоктар)')}</button>
  <button disabled={disabled} onClick={()=>create('code')}>{w('New robot program (C++ / Bluetooth)','Новая программа робота (C++ / Bluetooth)','Роботтың жаңа бағдарламасы (C++ / Bluetooth)')}</button>
 </>;
}
