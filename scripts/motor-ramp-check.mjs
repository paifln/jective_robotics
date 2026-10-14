import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
const root='test-results/motor-ramp';await mkdir(root,{recursive:true});await build({entryPoints:['packages/simulator/motor-ramp.ts'],outfile:root+'/model.cjs',platform:'node',format:'cjs',bundle:true});const {motorRampExperiment}=await import('../test-results/motor-ramp/model.cjs');
await writeFile(root+'/compare.cpp',`#include <cstdio>
#include "SafetyController.h"
int main(){jective::SafetyController m;m.arm(0,true,true);m.drive(20,20,2000,1,0);for(unsigned t=0;t<=1400;t+=20){if(t==600)m.drive(-20,-20,800,2,t);if(t==1200)m.disarm();auto out=m.tick(t,false);printf("%u,%.9f,%.9f,%d\\n",t,out.left,out.right,int(m.mode));}}
`);
const run=(file,args)=>new Promise((resolve,reject)=>{let log='';const child=spawn(file,args,{shell:false,windowsHide:true});child.stdout.on('data',data=>log+=data);child.stderr.on('data',data=>log+=data);child.once('error',reject);child.once('close',code=>resolve({code,log}));});
const compile=await run(resolve('.toolchain/host/zig-x86_64-windows-0.15.2/zig.exe'),['c++','-std=c++17','-O2','-UNDEBUG','-include','tests/firmware/assertions-required.h','-I','firmware/jective-runtime',root+'/compare.cpp','-o',root+'/compare.exe']);const execution=compile.code===0?await run(resolve(root+'/compare.exe'),[]):null;const experiment=motorRampExperiment();
const native=execution?.code===0?execution.log.trim().split(/\r?\n/).map(line=>line.split(',').map(Number)):[];
const matched=native.length===experiment.rows.length&&native.every((row,index)=>{const sample=experiment.rows[index];return row[0]===sample.timeMs&&Math.abs(row[1]-sample.leftPercent)<1e-5&&Math.abs(row[2]-sample.rightPercent)<1e-5&&row[3]===['disarmed','tethered','autonomous'].indexOf(sample.mode);});
const result={scope:'Host C++/TypeScript fixed ramp and reversal trace only. No physical motor, ESP32 scheduling or electrical stress measurement.',compile,execution,samples:experiment.rows.length,matched,passed:compile.code===0&&execution?.code===0&&matched};await writeFile(root+'/verification.json',JSON.stringify(result,null,2));await writeFile(root+'/experiment.json',JSON.stringify(experiment,null,2));console.log(JSON.stringify({passed:result.passed,samples:result.samples,reversal:experiment.reversal}));if(!result.passed)process.exitCode=1;
