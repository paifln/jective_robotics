import {build} from 'esbuild';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const root='test-results/build-errors';await mkdir(root,{recursive:true});await mkdir('evidence/build-errors',{recursive:true});
await build({entryPoints:['packages/content/build-error-cases.ts','packages/toolchain/index.ts','packages/toolchain/diagnostics.ts'],outdir:root,outbase:'packages',bundle:true,platform:'node',format:'cjs'});
const {buildErrorCases}=await import('../test-results/build-errors/content/build-error-cases.js'),{ToolchainService}=await import('../test-results/build-errors/toolchain/index.js'),{compilerDiagnostics}=await import('../test-results/build-errors/toolchain/diagnostics.js');
const service=new ToolchainService(resolve('.toolchain/bin/arduino-cli.exe'),resolve('.toolchain/workspace')),realRun=service.run.bind(service);service.run=(args,...options)=>{assert.notEqual(args[0],'upload','UPLOAD_FORBIDDEN_IN_LESSON_VERIFIER');return realRun(args,...options);};assert.throws(()=>service.run(['upload']),/UPLOAD_FORBIDDEN/);
const results=[];
for(const entry of buildErrorCases){
 const base={schemaVersion:1,id:randomUUID(),name:'L50 compiler '+entry.id,mode:'code',workspace:{},revision:0};const starter={...base,...entry.starter};console.log('Compiling actual fault: '+entry.id);const bad=await service.compile(starter);assert.equal(bad.state,'failed',entry.id+' unexpectedly succeeded');assert.equal(bad.artifacts.length,0);assert(new RegExp(entry.diagnosticPattern,'i').test(bad.log),entry.id+' diagnostic not observed');const diagnostics=compilerDiagnostics(bad.log,starter);assert(diagnostics.some(d=>d.kind==='error'||d.kind==='fatal error'),entry.id+' lacks a project diagnostic');
 console.log('Recompiling correction: '+entry.id);const corrected={...base,...entry.corrected},good=await service.compile(corrected);assert.equal(good.state,'succeeded',good.log);assert(good.artifacts.length>0);results.push({id:entry.id,starter,corrected,bad,good,diagnostics,physicalVerification:'NOT RUN'});await writeFile('evidence/build-errors/compiler.json',JSON.stringify({complete:false,results},null,2));
}
const sourceHashes={};for(const file of ['packages/content/build-error-cases.ts','packages/toolchain/index.ts','packages/toolchain/diagnostics.ts','scripts/build-errors-check.mjs'])sourceHashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
await writeFile('evidence/build-errors/compiler.json',JSON.stringify({complete:true,recordedAt:new Date().toISOString(),scope:'Actual Arduino CLI 1.5.1 and pinned ESP32 core; four faults and corrected recompilations; no upload or physical execution',results,sourceHashes,physicalVerification:'NOT RUN'},null,2));console.log('Four real failures and corrected builds verified. Upload/physical NOT RUN.');
