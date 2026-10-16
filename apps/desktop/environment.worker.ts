import {parentPort,workerData} from 'node:worker_threads';
import {createRequire} from 'node:module';
import {z} from 'zod';
import {snapshotEnvironment,snapshotEnvironmentUsing} from '../../packages/toolchain/environment';
import type {EnvironmentProgress} from '../../packages/contracts/build-stage';

async function run(){
 if(!parentPort)throw new Error('ENVIRONMENT_WORKER_NO_PORT');
 try{
  const data=z.object({executable:z.string().min(1).max(4096),root:z.string().min(1).max(4096),coreVersion:z.string().regex(/^\d+\.\d+\.\d+$/),flag:z.instanceof(SharedArrayBuffer).refine(v=>v.byteLength===4)}).strict().parse(workerData);
  const signal=new Int32Array(data.flag);
  const cancelled=()=>Atomics.load(signal,0)!==0;
  const progress=(value:EnvironmentProgress)=>parentPort!.postMessage({type:'progress',value});
  // SDK inputs are physical files, not assets in the application's ASAR archive.
  // Electron's original-fs preserves real filesystem stats without virtual archive handling.
  const loadNative=createRequire(__filename);
  const nativeFs=process.versions.electron?loadNative('original-fs') as typeof import('node:fs'):null;
  const value=nativeFs?await snapshotEnvironmentUsing(data.executable,data.root,data.coreVersion,cancelled,{createReadStream:nativeFs.createReadStream,lstat:nativeFs.promises.lstat,readdir:nativeFs.promises.readdir},progress):await snapshotEnvironment(data.executable,data.root,data.coreVersion,cancelled,progress);
  parentPort.postMessage({ok:true,value});
 }catch(error){parentPort.postMessage({ok:false,error:(error instanceof Error?error.message:'ENVIRONMENT_WORKER_FAILED').slice(0,4096)});}
}
void run();
