import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
const root='test-results/expression-order';await mkdir(root,{recursive:true});
await build({entryPoints:['packages/codegen/index.ts'],outfile:root+'/codegen.cjs',platform:'node',format:'cjs',bundle:true});
const {generate}=await import('../test-results/expression-order/codegen.cjs');
await writeFile(root+'/Arduino.h','#pragma once\ninline const char* lastMessage=nullptr;\ninline int messages=0;\nstruct StubSerial {void begin(int){} void println(const char* value){lastMessage=value;++messages;}};\ninline StubSerial Serial;\n');
const number=value=>({kind:'number',value});
const divide={kind:'binary',op:'/',left:number(1),right:number(0)};
const overflow={kind:'binary',op:'*',left:number(1e308),right:number(1e308)};
async function run(executable,args){return new Promise((done,reject)=>{let log='';const child=spawn(executable,args,{shell:false,windowsHide:true});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);child.once('error',reject);child.once('exit',code=>done({code,log}));});}
const cases=[];
for(const op of ['+','/','<','&&','||','not'])for(const leftFirst of [true,false]){
 const expected=leftFirst?'DIVISION_BY_ZERO':'EXPRESSION_RANGE';
 const value=op==='not'?{kind:'not',value:leftFirst?divide:overflow}:{kind:'binary',op,left:leftFirst?divide:overflow,right:leftFirst?overflow:divide};
 const program={setup:[{kind:'set',name:'result',value}],loop:[{kind:'set',name:'result',value:number(99)}]};
 const source=generate(program,null)+'\n#include <cassert>\n#include <cstring>\nint main(){setup();assert(j_expression_error);assert(jv_result==0);assert(messages==1);assert(strcmp(lastMessage,"'+expected+'") == 0);loop();assert(jv_result==0);assert(messages==1);}\n';
 const id=cases.length;await writeFile(root+`/case-${id}.cpp`,source);
 const compile=await run(resolve('.toolchain/host/zig-x86_64-windows-0.15.2/zig.exe'),['c++','-std=c++17','-O2','-UNDEBUG','-include','tests/firmware/assertions-required.h','-I',root,root+`/case-${id}.cpp`,'-o',root+`/case-${id}.exe`]);
 const execute=compile.code===0?await run(resolve(root+`/case-${id}.exe`),[]):null;
 cases.push({program,expected,compile,execute});
}
await writeFile(root+'/verification.json',JSON.stringify({cases,scope:'Twelve generated C++ programs executed with explicit Arduino host stubs; left-to-right error order and fault latch. Physical board NOT RUN.'},null,2));
const passed=cases.filter(c=>c.compile.code===0&&c.execute?.code===0).length;console.log(`${passed}/${cases.length} generated expression-order cases passed`);if(passed!==cases.length)process.exitCode=1;
