import {operationErrorText} from './operation-error-text';
import {useEffect,useRef,useState} from 'react';
import type {Result} from '../../../packages/contracts';
import type {Locale} from './locale';
import {words} from './StudentUI';

/** Serialize browser actions and ignore results belonging to a departed project. */
export function useWorkspaceAction(projectId:string,locale:Locale,setStatus:(message:string)=>void){
 const [busy,setBusy]=useState(false),epoch=useRef(0),pending=useRef(false);
 useEffect(()=>{epoch.current++;pending.current=false;setBusy(false);return()=>{epoch.current++;};},[projectId]);
 async function run<T>(action:()=>Promise<Result<T>>,completed:(value:T)=>void|Promise<void>){
  if(pending.current)return;pending.current=true;const token=epoch.current;setBusy(true);setStatus('');
  try{
   const result=await action();if(token!==epoch.current)return;
   if(result.ok)await completed(result.value);else setStatus(operationErrorText(result.error,locale));
  }catch{
   if(token===epoch.current)setStatus(words(locale,'Could not complete this action. Your current program is still open. Try again.','Не удалось выполнить действие. Текущая программа остаётся открытой. Повтори попытку.','Әрекетті орындау мүмкін болмады. Ағымдағы бағдарлама ашық қалды. Қайталап көріңіз.'));
  }finally{if(token===epoch.current){pending.current=false;setBusy(false);}}
 }
 return {busy,run};
}
