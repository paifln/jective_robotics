import {build} from 'esbuild';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const evidenceRoot=process.argv.includes('--lesson')?'evidence/repeatable-lesson':'evidence/repeatable-experiment';
await mkdir('.verification',{recursive:true});const file=resolve('.verification/repeatable-'+randomUUID()+'.cjs');const guard=relative(resolve('.verification'),file);assert(!guard.startsWith('..')&&!isAbsolute(guard));
const bundle=await build({entryPoints:['packages/content/repeatable-experiment.ts'],bundle:true,platform:'node',format:'cjs',write:false});await writeFile(file,bundle.outputFiles[0].contents,{flag:'wx'});
try{const {runRepeatableExperiment}=createRequire(import.meta.url)(file);const report=runRepeatableExperiment({seed:23,comparisonSeed:24,steps:200,noiseMeters:.05});for(const run of Object.values(report.runs)){assert.deepEqual(run.first,run.repeat);assert.notDeepEqual(run.first,run.changedSeed);assert.equal(run.first.at(-1).timeMs,4000);assert(run.first.every(state=>!state.collision));}assert(report.runs.early.first.at(-1).pose.x<report.runs.near.first.at(-1).pose.x);
 const controls=[];for(const input of [{seed:23,comparisonSeed:23,steps:200,noiseMeters:.05},{seed:23,comparisonSeed:24,steps:200,noiseMeters:0}]){const value=runRepeatableExperiment(input);for(const run of Object.values(value.runs))assert.deepEqual(run.first,run.changedSeed);controls.push({inputs:input,sameSeedMatches:true,changedSeedDiffers:false});}
 const paths=['packages/content/repeatable-experiment.ts','packages/simulator/index.ts','packages/simulator/world-schema.ts','packages/simulator/ray.ts','packages/simulator/distance.ts','packages/simulator/analog.ts'];const sourceHashes={};for(const path of paths)sourceHashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');await mkdir(evidenceRoot,{recursive:true});await writeFile(evidenceRoot+'/traces.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'Actual supported block IR simulation; no physical hardware',sourceHashes,bundleSha256:createHash('sha256').update(bundle.outputFiles[0].contents).digest('hex'),controls,report},null,2));console.log('Two algorithms: exact same-seed replay, changed-seed traces, shared 20 ms steps and unchanged controls verified.');
}finally{await rm(file,{force:true});}
