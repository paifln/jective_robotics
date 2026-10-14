import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
const root='test-results/while';await mkdir(root,{recursive:true});
await build({entryPoints:['packages/codegen/index.ts'],outfile:root+'/codegen.cjs',platform:'node',format:'cjs',bundle:true});
const {generate}=await import('../test-results/while/codegen.cjs');
const number=value=>({kind:'number',value});const variable=name=>({kind:'variable',name});
const good={setup:[{kind:'set',name:'count',value:number(0)},{kind:'while',condition:{kind:'binary',op:'<',left:variable('count'),right:number(3)},maxIterations:3,body:[{kind:'print',text:'iteration'},{kind:'wait',ms:100},{kind:'set',name:'count',value:{kind:'binary',op:'+',left:variable('count'),right:number(1)}}]},{kind:'print',text:'done'}],loop:[]};
const bad={setup:[{kind:'while',condition:number(1),maxIterations:3,body:[]},{kind:'print',text:'unreachable'}],loop:[]};
await writeFile(root+'/Arduino.h','#pragma once\ninline unsigned long now=0;\ninline int messages=0;\ninline const char* lastMessage=nullptr;\ninline void delay(unsigned long ms){now+=ms;}\nstruct StubSerial {void begin(int){} void println(const char* value){lastMessage=value;++messages;}};\ninline StubSerial Serial;\n');
async function run(executable,args){return new Promise((done,reject)=>{let log='';const child=spawn(executable,args,{shell:false,windowsHide:true});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);child.once('error',reject);child.once('exit',code=>done({code,log}));});}
const results=[];
for(const [name,program,assertions] of [['good',good,'assert(!j_expression_error);assert(jv_count==3);assert(now==300);assert(messages==4);assert(strcmp(lastMessage,"done")==0);'],['bad',bad,'assert(j_expression_error);assert(messages==1);assert(strcmp(lastMessage,"LOOP_BUDGET")==0);loop();assert(messages==1);']]){
 const source=generate(program,null);await writeFile(root+'/'+name+'.cpp',source+'\n#include <cassert>\n#include <cstring>\nint main(){setup();'+assertions+'}\n');
 const compile=await run(resolve('.toolchain/host/zig-x86_64-windows-0.15.2/zig.exe'),['c++','-std=c++17','-O2','-UNDEBUG','-include','tests/firmware/assertions-required.h','-I',root,root+'/'+name+'.cpp','-o',root+'/'+name+'.exe']);
 const execute=compile.code===0?await run(resolve(root+'/'+name+'.exe'),[]):null;results.push({name,source,compile,execute});
}
await build({entryPoints:['packages/toolchain/index.ts'],outfile:root+'/toolchain.cjs',platform:'node',format:'cjs',bundle:true});
const {ToolchainService}=await import('../test-results/while/toolchain.cjs');const service=new ToolchainService(resolve('.toolchain/bin/arduino-cli.exe'),resolve('.toolchain/workspace'));
const arduino=await service.compile({schemaVersion:1,id:crypto.randomUUID(),name:'Bounded condition loop compiler fixture',profileId:'esp32-devkit-reference',mode:'code',source:generate(good,null),workspace:{},revision:0});
await writeFile(root+'/verification.json',JSON.stringify({results,arduino,scope:'Actual generated C++ host execution of normal exit and bounded infinite-loop error; real ESP32 compilation. Upload/on-device NOT RUN.'},null,2));
console.log(results.map(r=>r.name+': '+r.execute?.code).join(', '),'ESP32: '+arduino.state);if(results.some(r=>r.compile.code!==0||r.execute?.code!==0)||arduino.state!=='succeeded')process.exitCode=1;
