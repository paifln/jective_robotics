import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
const root='test-results/pwm';await mkdir(root,{recursive:true});
await build({entryPoints:['packages/codegen/project.ts','packages/toolchain/index.ts','packages/content/lesson-pwm.ts'],outdir:root,platform:'node',format:'cjs',bundle:true});
const {generateForProject}=await import('../test-results/pwm/codegen/project.js');
const {ToolchainService}=await import('../test-results/pwm/toolchain/index.js');
const {pwmArtifact}=await import('../test-results/pwm/content/lesson-pwm.js');
const program=pwmArtifact.reference;
const project={schemaVersion:1,id:crypto.randomUUID(),name:'PWM real compiler fixture',profileId:'esp32-devkit-reference',mode:'blocks',source:'',workspace:{},revision:0};
const source=generateForProject(program,project);await writeFile(root+'/sketch.ino',source);
await writeFile(root+'/Arduino.h',`#pragma once
#include <vector>
#include <string>
#include <cstdint>
#define HIGH 1
#define LOW 0
#define OUTPUT 1
inline unsigned long now=0;
inline bool attachOK=true,writeOK=true;
inline std::vector<uint32_t> duties;
inline std::vector<std::string> messages;
inline int attaches=0;
inline void delay(unsigned long ms){now+=ms;}
inline void digitalWrite(int,int){}
inline void pinMode(int,int){}
inline bool ledcAttach(uint8_t pin,uint32_t frequency,uint8_t resolution){++attaches;return attachOK&&pin==2&&frequency==1000&&resolution==8;}
inline bool ledcWrite(uint8_t pin,uint32_t duty){if(!writeOK||pin!=2||duty>255)return false;duties.push_back(duty);return true;}
struct StubSerial {void begin(int){} void println(const char* value){messages.emplace_back(value);}};
inline StubSerial Serial;
`);
await writeFile(root+'/host.cpp',source+`
#include <cassert>
#include <limits>
void reset(){j_expression_error=false;jv_level=0;duties.clear();messages.clear();now=0;attaches=0;attachOK=true;writeOK=true;}
int main(){
 setup();assert(!j_expression_error);assert(now==1000);assert(attaches==1);assert(duties==std::vector<uint32_t>({0,0,64,128,191,255,0}));assert(messages==std::vector<std::string>({"DONE"}));
 assert(j_pwm(100));assert(duties.back()==255);assert(j_pwm(0));assert(duties.back()==0);
 for(double value:{0.0,12.5,25.0,50.0,75.0,100.0}){assert(j_pwm(value));assert(duties.back()==static_cast<uint32_t>(floor(value*255.0/100.0+0.5)));}
 for(double value:{-0.1,100.1,std::numeric_limits<double>::infinity(),std::numeric_limits<double>::quiet_NaN()}){reset();assert(!j_pwm(value));assert(j_expression_error);assert(duties.empty());assert(messages==std::vector<std::string>({"PWM_RANGE"}));assert(!j_pwm(0));setup();loop();assert(duties.empty());assert(attaches==0);assert(messages.size()==1);}
 reset();attachOK=false;setup();assert(j_expression_error);assert(now==0);assert(duties.empty());assert(messages==std::vector<std::string>({"PWM_ATTACH_FAILED"}));
 reset();writeOK=false;setup();assert(j_expression_error);assert(now==0);assert(duties.empty());assert(messages==std::vector<std::string>({"PWM_WRITE_FAILED"}));
 reset();j_expression_fault("DIVISION_BY_ZERO");assert(!j_pwm(50));assert(duties.empty());assert(messages==std::vector<std::string>({"DIVISION_BY_ZERO"}));
 reset();assert(j_pwm(25));writeOK=false;assert(!j_pwm(50));assert(duties==std::vector<uint32_t>({64}));assert(messages==std::vector<std::string>({"PWM_WRITE_FAILED"}));
}
`);
async function run(executable,args){return new Promise((done,reject)=>{let log='';const child=spawn(executable,args,{shell:false,windowsHide:true});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);child.once('error',reject);child.once('exit',code=>done({code,log}));});}
const compile=await run(resolve('.toolchain/host/zig-x86_64-windows-0.15.2/zig.exe'),['c++','-std=c++17','-O2','-UNDEBUG','-include','tests/firmware/assertions-required.h','-I',root,root+'/host.cpp','-o',root+'/host.exe']);
const execute=compile.code===0?await run(resolve(root+'/host.exe'),[]):null;console.log('PWM host execution: '+execute?.code);
const service=new ToolchainService(resolve('.toolchain/bin/arduino-cli.exe'),resolve('.toolchain/workspace')),arduino=[];
for(const profileId of ['esp32-devkit-reference','esp32c3-reference']){const selected={...project,id:crypto.randomUUID(),profileId};selected.source=generateForProject(program,selected);const result=await service.compile(selected);arduino.push({profileId,...result});console.log(profileId+': '+result.state);}
await writeFile(root+'/verification.json',JSON.stringify({compile,execute,arduino,scope:'Generated bounded PWM sweep compiled for real ESP32 and ESP32-C3 pinned toolchains. Host stubs assert quantization, attach/write failures, latched fault and binary LED consistency. This does not prove physical PWM waveform, wiring, brightness or driver behavior. Upload and physical hardware NOT RUN.'},null,2));
if(compile.code!==0||execute?.code!==0||arduino.some(result=>result.state!=='succeeded'))process.exitCode=1;
