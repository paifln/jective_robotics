import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const root='test-results/motor-model';await mkdir(root,{recursive:true});
await build({entryPoints:['packages/simulator/safe-motor.ts'],outfile:root+'/model.cjs',platform:'node',format:'cjs',bundle:true});
const {motorSafetyExperiment}=await import('../test-results/motor-model/model.cjs');
const source=`#include <cstdio>
#include "SafetyController.h"
int main(){for(int kind=0;kind<3;kind++){jective::SafetyController model;
auto sample=[&](unsigned time){auto out=model.tick(time,false);printf("S,%d,%u,%.9f,%.9f,%d\\n",kind,time,out.left,out.right,int(model.mode));};
auto action=[&](unsigned time,const char* name,bool accepted){printf("A,%d,%u,%s,%d\\n",kind,time,name,accepted);};
sample(0);action(0,"drive before arm",model.drive(10,10,1000,1,0));action(0,"arm tethered",model.arm(0,false,false));action(0,"drive 10%",model.drive(10,10,1000,1,0));
for(unsigned time=20;time<=500;time+=20){if(kind!=2&&time%100==0&&time<300)action(time,"heartbeat",model.heartbeat(time,time));if(kind==1&&time==300){model.disarm();action(time,"stop and disarm",true);}if(time==500){model.disarm();action(time,"end experiment: disarm",true);}sample(time);}}}
`;
await writeFile(root+'/compare.cpp',source);
const run=(file,args)=>new Promise((resolve,reject)=>{let log='';const child=spawn(file,args,{shell:false,windowsHide:true});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);child.once('error',reject);child.once('close',code=>resolve({code,log}));});
const compile=await run(resolve('.toolchain/host/zig-x86_64-windows-0.15.2/zig.exe'),['c++','-std=c++17','-O2','-UNDEBUG','-include','tests/firmware/assertions-required.h','-I','firmware/jective-runtime',root+'/compare.cpp','-o',root+'/compare.exe']);
const execution=compile.code===0?await run(resolve(root+'/compare.exe'),[]):null;
const comparisons=[];
if(execution?.code===0){const lines=execution.log.trim().split(/\r?\n/).map(line=>line.split(','));for(const [index,kind] of ['startup','stop','communication-loss'].entries()){
 const expected=motorSafetyExperiment(kind),nativeSamples=lines.filter(row=>row[0]==='S'&&Number(row[1])===index),nativeActions=lines.filter(row=>row[0]==='A'&&Number(row[1])===index);
 const samplesMatch=nativeSamples.length===expected.samples.length&&nativeSamples.every((row,i)=>{const sample=expected.samples[i];return Number(row[2])===sample.timeMs&&Math.abs(Number(row[3])-sample.left)<1e-5&&Math.abs(Number(row[4])-sample.right)<1e-5&&Number(row[5])===['disarmed','tethered','autonomous'].indexOf(sample.mode);});
 const actionsMatch=nativeActions.length===expected.actions.length&&nativeActions.every((row,i)=>Number(row[2])===expected.actions[i].timeMs&&row[3]===expected.actions[i].action&&Boolean(Number(row[4]))===expected.actions[i].accepted);
 comparisons.push({kind,samplesMatch,actionsMatch,sampleCount:expected.samples.length,actionCount:expected.actions.length});await writeFile(root+'/'+kind+'.json',JSON.stringify(expected,null,2));
}}
const hash=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
const result={scope:'Host C++ versus TypeScript: three fixed L20 simulation scenarios only. No ESP32 scheduling, electrical output, physical stop or full-controller parity claim.',compile,execution,comparisons,sourceSHA256:{firmware:await hash('firmware/jective-runtime/SafetyController.h'),model:await hash('packages/simulator/safe-motor.ts')},passed:compile.code===0&&execution?.code===0&&comparisons.length===3&&comparisons.every(c=>c.samplesMatch&&c.actionsMatch)};
await writeFile(root+'/verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify({passed:result.passed,comparisons}));if(!result.passed)process.exitCode=1;
