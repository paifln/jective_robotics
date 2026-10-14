import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
const root='test-results/print-value';await mkdir(root,{recursive:true});await build({entryPoints:['packages/codegen/index.ts','packages/toolchain/index.ts'],outdir:root,platform:'node',format:'cjs',bundle:true});
const {generate}=await import('../test-results/print-value/codegen/index.js'),{ToolchainService}=await import('../test-results/print-value/toolchain/index.js');
await writeFile(root+'/Arduino.h',`#pragma once
#include <cstdint>
#include <string>
#include <vector>
inline std::vector<std::string> messages;
inline std::string pending;
struct StubSerial { void begin(int){} void print(const char* value){pending+=value;} void print(unsigned long value){pending+=std::to_string(value);} void write(uint8_t value){pending+=static_cast<char>(value);} void println(){messages.push_back(pending);pending.clear();} void println(const char* value){print(value);println();} };
inline StubSerial Serial;
inline void delay(unsigned long){}
`);
const number=value=>({kind:'number',value});const program={setup:[{kind:'set',name:'measurement',value:number(-.5)},{kind:'printValue',label:'distance_m=',value:{kind:'variable',name:'measurement'}}],loop:[]};const source=generate(program,null);
const assertions=`
#include <cassert>
int main(){setup();assert(messages==std::vector<std::string>({"distance_m=-0.500000"}));
for(double value:{0.0,0.5,-0.5,0.0000005,-0.0000005,-0.0000001,1000000000.0,-1000000000.0})assert(j_print_value("V=",value));
assert(messages==std::vector<std::string>({"distance_m=-0.500000","V=0.000000","V=0.500000","V=-0.500000","V=0.000001","V=-0.000001","V=0.000000","V=1000000000.000000","V=-1000000000.000000"}));
for(double value:std::vector<double>{1000000001.0,-1000000001.0,INFINITY,NAN}){messages.clear();j_expression_error=false;assert(!j_print_value("UNREACHABLE=",value));assert(messages==std::vector<std::string>({"PRINT_VALUE_RANGE"}));setup();assert(messages.size()==1);}
messages.clear();j_expression_error=false;assert(!j_print_value("UNREACHABLE=",j_div(1,0)));assert(messages==std::vector<std::string>({"DIVISION_BY_ZERO"}));assert(pending.empty());}
`;
await writeFile(root+'/generated.cpp',source+assertions);
const run=(file,args)=>new Promise((resolve,reject)=>{let log='';const child=spawn(file,args,{shell:false,windowsHide:true});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);child.once('error',reject);child.once('close',code=>resolve({code,log}));});
const hostCompile=await run(resolve('.toolchain/host/zig-x86_64-windows-0.15.2/zig.exe'),['c++','-std=c++17','-O2','-UNDEBUG','-include','tests/firmware/assertions-required.h','-I',root,root+'/generated.cpp','-o',root+'/generated.exe']);const hostRun=hostCompile.code===0?await run(resolve(root+'/generated.exe'),[]):null;
const service=new ToolchainService(resolve('.toolchain/bin/arduino-cli.exe'),resolve('.toolchain/workspace'));const arduino=await service.compile({schemaVersion:1,id:crypto.randomUUID(),name:'Numeric serial generated sketch',profileId:'esp32-devkit-reference',mode:'code',source,workspace:{},revision:0});
await writeFile(root+'/verification.json',JSON.stringify({hostCompile,hostRun,arduino,scope:'Generated numeric serial C++ executed with explicit host Serial stubs and built with actual ESP32 core. No upload or physical serial output.'},null,2));console.log(JSON.stringify({hostCompile:hostCompile.code,hostRun:hostRun?.code,arduino:arduino.state}));if(hostCompile.code!==0||hostRun?.code!==0||arduino.state!=='succeeded')process.exitCode=1;
