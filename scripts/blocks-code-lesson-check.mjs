import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
await mkdir('test-results/blocks-code-lesson',{recursive:true});await mkdir('evidence/blocks-code-lesson',{recursive:true});
await build({entryPoints:['packages/content/blocks-code.ts','packages/toolchain/index.ts'],outdir:'test-results/blocks-code-lesson',outbase:'packages',bundle:true,platform:'node',format:'cjs'});
const {blocksCodeMapping}=await import('../test-results/blocks-code-lesson/content/blocks-code.js');
const {ToolchainService}=await import('../test-results/blocks-code-lesson/toolchain/index.js');
const service=new ToolchainService(resolve('.toolchain/bin/arduino-cli.exe'),resolve('.toolchain/workspace'));
const project=source=>({schemaVersion:1,id:crypto.randomUUID(),name:'L37 compiler check',profileId:'esp32-devkit-reference',mode:'code',source,workspace:{},revision:0});
const starter=blocksCodeMapping(),reference=blocksCodeMapping(250),edited=reference.source.replace('Serial.println("LOOP STEP");','Serial.println("Code copy");'),invalid=edited.replace('Serial.println("Code copy");','Serial.println("Code copy")');
const results=[];for(const [name,source,expected]of [['starter',starter.source,'succeeded'],['reference',reference.source,'succeeded'],['independent-edited-copy',edited,'succeeded'],['deliberate-missing-semicolon',invalid,'failed']]){const result=await service.compile(project(source));results.push({name,expected,result});assert.equal(result.state,expected,name);if(expected==='succeeded')assert(result.artifacts.length>0);else assert.match(result.log,/error:/);}
await writeFile('evidence/blocks-code-lesson/compiler.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'Actual Arduino CLI compilation for ESP32 reference, no upload or physical observation',results},null,2));console.log('L37 starter, reference and edited source compile; missing semicolon is rejected by the actual compiler.');
