import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const root='test-results/assertions';await mkdir(root,{recursive:true});await mkdir('evidence/assertions',{recursive:true});
await writeFile(root+'/probe.cpp','#include <cassert>\nint main(){int called=0;assert(++called==1);return called==1?0:7;}\n');
async function run(exe,args){return new Promise((done,reject)=>{let log='';const p=spawn(exe,args,{shell:false,windowsHide:true});p.stdout.on('data',d=>log+=d);p.stderr.on('data',d=>log+=d);p.once('error',reject);p.once('exit',code=>done({code,log}));});}
const compiler=resolve('.toolchain/host/zig-x86_64-windows-0.15.2/zig.exe'),base=['c++','-std=c++17','-O2'];
const disabledCompile=await run(compiler,[...base,root+'/probe.cpp','-o',root+'/disabled.exe']);assert.equal(disabledCompile.code,0);const disabledRun=await run(resolve(root+'/disabled.exe'),[]);assert.equal(disabledRun.code,7,'Probe must detect an omitted assertion side effect');
const guardCompile=await run(compiler,[...base,'-include','tests/firmware/assertions-required.h',root+'/probe.cpp','-o',root+'/guarded-disabled.exe']);assert.notEqual(guardCompile.code,0);assert.match(guardCompile.log,/Host verification requires assertions/);
const enabledCompile=await run(compiler,[...base,'-UNDEBUG','-include','tests/firmware/assertions-required.h',root+'/probe.cpp','-o',root+'/enabled.exe']);assert.equal(enabledCompile.code,0,enabledCompile.log);const enabledRun=await run(resolve(root+'/enabled.exe'),[]);assert.equal(enabledRun.code,0,'Assertion must execute');
await writeFile('evidence/assertions/probe.json',JSON.stringify({checkedAt:new Date().toISOString(),disabledCompile,disabledRun,guardCompile,enabledCompile,enabledRun,scope:'Empirical assertion execution and disabled-assertion build rejection; no physical devices'},null,2));console.log('Disabled assertions detected; guard rejects them; enabled assertion executes.');
