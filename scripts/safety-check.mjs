import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const compiler=resolve('.toolchain/host/zig-x86_64-windows-0.15.2/zig.exe');await mkdir('test-results',{recursive:true});
async function run(exe,args){return new Promise((done,reject)=>{let log='';const child=spawn(exe,args,{shell:false,windowsHide:true});child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);child.once('error',reject);child.once('exit',code=>done({code,log}));});}
const compile=await run(compiler,['c++','-std=c++17','-O2','-UNDEBUG','-include','tests/firmware/assertions-required.h','tests/firmware/safety_test.cpp','-o','test-results/safety_test.exe']);let execute=null;if(compile.code===0)execute=await run(resolve('test-results/safety_test.exe'),[]);await writeFile('test-results/safety.json',JSON.stringify({compiler:'Zig 0.15.2, verified official download SHA256',compile,execute,physical:'NOT RUN'},null,2));console.log(compile.log,execute?.log??'');if(compile.code!==0||execute?.code!==0)throw new Error('C++ safety tests failed');
