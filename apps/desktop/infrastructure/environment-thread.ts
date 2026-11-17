import {Worker} from 'node:worker_threads';
import {join} from 'node:path';
import {z} from 'zod';
import {EnvironmentSnapshotSchema,type EnvironmentSnapshot} from '../../../packages/toolchain/environment';
import {EnvironmentProgressSchema,type EnvironmentProgress} from '../../../packages/contracts/build-stage';
import type {BoardProfile} from '../../../packages/profiles';

const Reply=z.discriminatedUnion('ok',[
 z.object({ok:z.literal(true),value:EnvironmentSnapshotSchema}).strict(),
 z.object({ok:z.literal(false),error:z.string().min(1).max(4096)}).strict()
]);
const ProgressReply=z.object({type:z.literal('progress'),value:EnvironmentProgressSchema}).strict();
/** Only the main process supplies the approved executable/root; no renderer worker-path API. */
export function snapshotEnvironmentInThread(executable:string,root:string,coreVersion:string,cancelled:()=>boolean=()=>false,workerPath=join(__dirname,'environment.worker.cjs'),timeoutMs=300000,onProgress?:(progress:EnvironmentProgress)=>void,core:BoardProfile['core']='esp32:esp32'):Promise<EnvironmentSnapshot>{
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>300000)return Promise.reject(new Error('ENVIRONMENT_WORKER_TIMEOUT_INVALID'));
 if(cancelled())return Promise.reject(new Error('BUILD_INTERRUPTED'));
 return new Promise((resolve,reject)=>{
  const flag=new SharedArrayBuffer(4),signal=new Int32Array(flag);
  const worker=new Worker(workerPath,{workerData:{executable,root,coreVersion,flag,core},execArgv:[],resourceLimits:{maxOldGenerationSizeMb:128}});
  let settled=false;
  const finish=async(error:Error|null,value?:EnvironmentSnapshot)=>{
   if(settled)return;settled=true;clearInterval(poll);clearTimeout(timeout);
   Atomics.store(signal,0,1);
   try{await worker.terminate();}catch{error??=new Error('ENVIRONMENT_WORKER_STOP_FAILED');}
   if(error)reject(error);else if(value)resolve(value);else reject(new Error('ENVIRONMENT_WORKER_NO_RESULT'));
  };
  const poll=setInterval(()=>{if(cancelled())void finish(new Error('BUILD_INTERRUPTED'));},50);
  const timeout=setTimeout(()=>void finish(new Error('ENVIRONMENT_WORKER_TIMEOUT')),timeoutMs);
  worker.on('message',(value:unknown)=>{
   if(settled)return;
   if(value&&typeof value==='object'&&'type'in value&&value.type==='progress'){
    const progress=ProgressReply.safeParse(value);
    if(!progress.success)void finish(new Error('ENVIRONMENT_WORKER_INVALID_REPLY'));else try{onProgress?.(progress.data.value);}catch{/* Progress is informational, not a source of a trusted snapshot. */}
    return;
   }
   const result=Reply.safeParse(value);if(!result.success)void finish(new Error('ENVIRONMENT_WORKER_INVALID_REPLY'));else if(!result.data.ok)void finish(new Error(result.data.error));else void finish(null,result.data.value);
  });
  worker.on('error',error=>void finish(error));
  worker.on('exit',code=>{if(!settled)void finish(new Error('ENVIRONMENT_WORKER_EXIT: '+code));});
 });
}
