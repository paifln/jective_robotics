import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
await mkdir('test-results',{recursive:true});
async function run(executable,args){return new Promise((done,reject)=>{let log='';const child=spawn(executable,args,{shell:false,windowsHide:true});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);child.once('error',reject);child.once('exit',code=>done({code,log}));});}
const compile=await run(resolve('.toolchain/host/zig-x86_64-windows-0.15.2/zig.exe'),['c++','-std=c++17','-O2','-UNDEBUG','-include','tests/firmware/assertions-required.h','-I','tests/firmware/stubs','tests/firmware/timing_test.cpp','-o','test-results/timing_test.exe']);
const execute=compile.code===0?await run(resolve('test-results/timing_test.exe'),[]):null;
await build({entryPoints:['packages/toolchain/index.ts'],outfile:'test-results/timing-toolchain.cjs',platform:'node',format:'cjs',bundle:true});
const {ToolchainService}=await import('../test-results/timing-toolchain.cjs');
const service=new ToolchainService(resolve('.toolchain/bin/arduino-cli.exe'),resolve('.toolchain/workspace'));
const source=await readFile('examples/two-indicator-cooperative.ino','utf8');
const base={schemaVersion:1,id:crypto.randomUUID(),name:'L04 cooperative software-only compile fixture',profileId:'esp32-devkit-reference',mode:'code',workspace:{},revision:0};
// Fixture-only pin constants; this is not a wiring recommendation or an upload.
const arduino=await service.compile({...base,source:'#define JECTIVE_INDICATOR_ONE_PIN 2\n#define JECTIVE_INDICATOR_TWO_PIN 4\n#define JECTIVE_STOP_PIN 5\n'+source});
const unmapped=await service.compile({...base,source});
const result={scope:'Host execution with Arduino I/O stubs plus real ESP32 compiler. No GPIO or serial port is operated.',compile,execute,arduino,unmapped,physical:'NOT RUN',upload:'NOT RUN'};
await writeFile('test-results/timing.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({hostCompile:compile.code,hostExecution:execute?.code,hostLog:execute?.log,arduino:arduino.state,unmapped:unmapped.state,physical:result.physical},null,2));
if(compile.code!==0||execute?.code!==0||arduino.state!=='succeeded'||unmapped.state!=='failed'){console.error(compile.log,arduino.log,unmapped.log);process.exitCode=1;}
