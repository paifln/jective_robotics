import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
const root='test-results/mapping';await mkdir(root,{recursive:true});
await build({entryPoints:['packages/content/lessons.ts'],outfile:root+'/content.cjs',platform:'node',format:'cjs',bundle:true});
await build({entryPoints:['packages/codegen/index.ts'],outfile:root+'/codegen.cjs',platform:'node',format:'cjs',bundle:true});
const {artifacts}=await import('../test-results/mapping/content.cjs');const {generate}=await import('../test-results/mapping/codegen.cjs');
await writeFile(root+'/Arduino.h','#pragma once\ninline void delay(unsigned long){}\nstruct StubSerial {void begin(int){} void println(const char*){}};\ninline StubSerial Serial;\n');
async function run(executable,args){return new Promise((done,reject)=>{let log='';const child=spawn(executable,args,{shell:false,windowsHide:true});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);child.once('error',reject);child.once('exit',code=>done({code,log}));});}
const source=generate(artifacts.L08.reference,null);
await writeFile(root+'/test.cpp',source+'\n#include <cassert>\nint main(){setup();double inputs[]={-10,0,50,100,110};double expected[]={0,0,15,30,30};for(int i=0;i<5;++i){jv_input_value=inputs[i];loop();assert(jv_output_request_pct==expected[i]);assert(jv_input_value==inputs[i]);}jv_output_min_pct=5;jv_output_max_pct=25;double second[]={5,5,15,25,25};for(int i=0;i<5;++i){jv_input_value=inputs[i];loop();assert(jv_output_request_pct==second[i]);}jv_input_max=0;double previous=jv_output_request_pct;loop();assert(j_expression_error);assert(jv_output_request_pct==previous);}\n');
const compile=await run(resolve('.toolchain/host/zig-x86_64-windows-0.15.2/zig.exe'),['c++','-std=c++17','-O2','-UNDEBUG','-include','tests/firmware/assertions-required.h','-I',root,root+'/test.cpp','-o',root+'/test.exe']);
const execute=compile.code===0?await run(resolve(root+'/test.exe'),[]):null;
await build({entryPoints:['packages/toolchain/index.ts'],outfile:root+'/toolchain.cjs',platform:'node',format:'cjs',bundle:true});
const {ToolchainService}=await import('../test-results/mapping/toolchain.cjs');const service=new ToolchainService(resolve('.toolchain/bin/arduino-cli.exe'),resolve('.toolchain/workspace'));
const arduino=[];for(const variant of ['starter','reference'])arduino.push({variant,...await service.compile({schemaVersion:1,id:crypto.randomUUID(),name:'L08 '+variant+' compile',profileId:'esp32-devkit-reference',mode:'code',source:generate(artifacts.L08[variant],null),workspace:{},revision:0})});
await writeFile(root+'/verification.json',JSON.stringify({compile,execute,arduino,scope:'L08 actual generated C++ host execution with ten mapping cases and zero-span fault; both programs compiled for ESP32. Upload/physical NOT RUN.'},null,2));
console.log(compile.log,'Host execution: '+execute?.code,arduino.map(r=>r.variant+': '+r.state).join(', '));if(compile.code!==0||execute?.code!==0||arduino.some(r=>r.state!=='succeeded'))process.exitCode=1;
