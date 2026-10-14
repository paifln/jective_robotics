import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
const root='test-results/functions-lesson';await mkdir(root,{recursive:true});
await build({entryPoints:['packages/content/lesson-functions.ts','packages/codegen/index.ts','packages/toolchain/index.ts'],outdir:root,platform:'node',format:'cjs',bundle:true});
const {functionsArtifact}=await import('../test-results/functions-lesson/content/lesson-functions.js');
const {generate}=await import('../test-results/functions-lesson/codegen/index.js');
const {ToolchainService}=await import('../test-results/functions-lesson/toolchain/index.js');
await writeFile(root+'/Arduino.h','#pragma once\n#include <vector>\n#include <string>\n#define HIGH 1\n#define LOW 0\n#define OUTPUT 1\ninline unsigned long now=0;\ninline int indicator=0;\ninline std::vector<std::string> messages;\ninline void delay(unsigned long ms){now+=ms;}\ninline void digitalWrite(int,int value){indicator=value;}\ninline void pinMode(int,int){}\nstruct StubSerial {void begin(int){} void println(const char* value){messages.emplace_back(value);}};\ninline StubSerial Serial;\n');
async function run(executable,args){return new Promise((done,reject)=>{let log='';const child=spawn(executable,args,{shell:false,windowsHide:true});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);child.once('error',reject);child.once('exit',code=>done({code,log}));});}
const results=[],service=new ToolchainService(resolve('.toolchain/bin/arduino-cli.exe'),resolve('.toolchain/workspace'));
for(const name of ['starter','reference']){
 const program=functionsArtifact[name],source=generate(program,2);
 const assertions='assert(!j_expression_error);assert(now==300);assert(indicator=='+(name==='starter'?1:0)+');assert(messages==std::vector<std::string>({"BETWEEN","DONE"}));'+(name==='reference'?'for(double value:{0.0,1.0,100.0,60000.0}){now=0;jf_pulse(value);assert(now==value);assert(indicator==0);assert(!j_expression_error);}for(double value:{-1.0,0.5,60001.0}){j_expression_error=false;messages.clear();now=0;jf_pulse(value);assert(j_expression_error);assert(now==0);assert(messages==std::vector<std::string>({"WAIT_RANGE"}));setup();assert(now==0);assert(messages.size()==1);}':'');
 await writeFile(root+'/'+name+'.cpp',source+'\n#include <cassert>\nint main(){setup();'+assertions+'}\n');
 const compile=await run(resolve('.toolchain/host/zig-x86_64-windows-0.15.2/zig.exe'),['c++','-std=c++17','-O2','-UNDEBUG','-include','tests/firmware/assertions-required.h','-I',root,root+'/'+name+'.cpp','-o',root+'/'+name+'.exe']);
 const execute=compile.code===0?await run(resolve(root+'/'+name+'.exe'),[]):null;
 const arduino=await service.compile({schemaVersion:1,id:crypto.randomUUID(),name:'L11 '+name+' real compilation',profileId:'esp32-devkit-reference',mode:'code',source,workspace:{},revision:0});
 results.push({name,source,compile,execute,arduino});console.log(name+': host '+execute?.code+', ESP32 '+arduino.state);
}
await writeFile(root+'/verification.json',JSON.stringify({results,scope:'Actual L11 starter and reference generated C++ executed using explicit Arduino host stubs and compiled using real ESP32 toolchain. Reference normal/boundary/error arguments asserted. Upload and physical hardware NOT RUN.'},null,2));
if(results.some(r=>r.compile.code!==0||r.execute?.code!==0||r.arduino.state!=='succeeded'))process.exitCode=1;
