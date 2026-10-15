type RecoveryReason='PROCESS_GONE'|'LOAD_FAILED';
type RecoveryWindow={isDestroyed:()=>boolean;reload:()=>void;close:()=>void};
/** One prompt at a time; no automatic reload loop or destructive workspace reset. */
export function rendererRecovery(window:RecoveryWindow,prompt:(reason:RecoveryReason)=>Promise<'retry'|'close'>,record:(code:string)=>void){
 let prompting=false;
 return async(reason:RecoveryReason)=>{
  if(prompting||window.isDestroyed())return;
  prompting=true;record(reason);
  try{
   const choice=await prompt(reason);
   if(window.isDestroyed())return;
   if(choice==='retry')window.reload();else window.close();
  }catch{record('RECOVERY_FAILED');}
  finally{prompting=false;}
 };
}
