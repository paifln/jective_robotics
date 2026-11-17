import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
await mkdir('test-results',{recursive:true});
const compiler=resolve('.toolchain/host/zig-x86_64-windows-0.15.2/zig.exe');
async function run(executable,args){return new Promise((done,reject)=>{let log='';const child=spawn(executable,args,{windowsHide:true,shell:false,env:{...process.env,ZIG_GLOBAL_CACHE_DIR:resolve('.toolchain/host/cache')}});child.stdout.on('data',data=>log+=data);child.stderr.on('data',data=>log+=data);child.once('error',reject);child.once('exit',code=>done({code,log}));});}
const compile=await run(compiler,['c++','-std=c++17','-O2','-UNDEBUG','-Itests/firmware/wireless-stubs','tests/firmware/arduino_wireless_test.cpp','-o','test-results/arduino_wireless_test.exe']);
const execution=compile.code===0?await run(resolve('test-results/arduino_wireless_test.exe'),[]):null;
await writeFile('test-results/arduino-wireless-firmware.json',JSON.stringify({compiler:'Zig 0.15.2, official SHA256-verified archive',compile,execution,physical:'NOT RUN'},null,2));
console.log(compile.log,execution?.log??'');
if(compile.code!==0||execution?.code!==0)throw new Error('Arduino wireless firmware host tests failed');
