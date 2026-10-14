import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
await mkdir('test-results',{recursive:true});
await build({entryPoints:['packages/codegen/index.ts'],outfile:'test-results/expression-codegen.cjs',platform:'node',format:'cjs',bundle:true});
const {generate}=await import('../test-results/expression-codegen.cjs');
const number=value=>({kind:'number',value});const zeroDivision={kind:'binary',op:'/',left:number(1),right:number(0)};
const program={setup:[...[0,-2,0.5].map((value,index)=>({kind:'set',name:'not'+index,value:{kind:'not',value:number(value)}})),{kind:'set',name:'fraction',value:{kind:'binary',op:'/',left:number(1),right:number(2)}},...['&&','||'].map((op,index)=>({kind:'if',condition:{kind:'binary',op,left:number(index),right:zeroDivision},then:[{kind:'set',name:'result'+index,value:number(1)}],otherwise:[{kind:'set',name:'result'+index,value:number(0)}]}))],loop:[{kind:'set',name:'sentinel',value:number(1)}]};
const source=generate(program,null)+'\n#include <cassert>\n#include <cstdio>\nint main(){setup();assert(jv_fraction==0.5);assert(jv_not0==1);assert(jv_not1==0);assert(jv_not2==0);assert(jv_result0==0);assert(jv_result1==1);assert(j_div(1,0)==0);assert(j_expression_error);loop();assert(jv_sentinel==0);jv_fraction=9;setup();assert(jv_fraction==9);j_expression_error=false;assert(j_finite(1e308*1e308)==0);assert(j_expression_error);loop();assert(jv_sentinel==0);puts("PASS: generated C++ double division, logical short-circuit, explicit arithmetic faults and latched execution; host stub only");}\n';
await writeFile('test-results/expression_test.cpp',source);
async function run(executable,args){return new Promise((done,reject)=>{let log='';const child=spawn(executable,args,{shell:false,windowsHide:true});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);child.once('error',reject);child.once('exit',code=>done({code,log}));});}
const compile=await run(resolve('.toolchain/host/zig-x86_64-windows-0.15.2/zig.exe'),['c++','-std=c++17','-O2','-UNDEBUG','-include','tests/firmware/assertions-required.h','-I','tests/firmware/stubs','test-results/expression_test.cpp','-o','test-results/expression_test.exe']);
const execute=compile.code===0?await run(resolve('test-results/expression_test.exe'),[]):null;
await build({entryPoints:['packages/toolchain/index.ts'],outfile:'test-results/expression-toolchain.cjs',platform:'node',format:'cjs',bundle:true});
const {ToolchainService}=await import('../test-results/expression-toolchain.cjs');
const service=new ToolchainService(resolve('.toolchain/bin/arduino-cli.exe'),resolve('.toolchain/workspace'));
const arduino=await service.compile({schemaVersion:1,id:crypto.randomUUID(),name:'Expression semantics compile fixture',profileId:'esp32-devkit-reference',mode:'code',source:generate(program,null),workspace:{},revision:0});
await writeFile('test-results/expression-semantics.json',JSON.stringify({program,source,compile,execute,arduino,scope:'Actual generated C++ executed with explicit Arduino stubs and compiled by pinned ESP32 toolchain. Upload/on-device NOT RUN.'},null,2));console.log(compile.log,execute?.log??'', 'ESP32 compile: '+arduino.state);if(compile.code!==0||execute?.code!==0||arduino.state!=='succeeded')process.exitCode=1;
