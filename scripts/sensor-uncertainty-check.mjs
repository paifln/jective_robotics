import {build} from 'esbuild';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
await mkdir('.verification',{recursive:true});const file=resolve('.verification/sensor-uncertainty-'+randomUUID()+'.cjs'),guard=relative(resolve('.verification'),file);assert(!guard.startsWith('..')&&!isAbsolute(guard));
const bundle=await build({entryPoints:['packages/content/sensor-uncertainty.ts'],bundle:true,platform:'node',format:'cjs',write:false});await writeFile(file,bundle.outputFiles[0].contents,{flag:'wx'});
try{
 const {runSensorUncertainty,describeEnteredMeasurements}=createRequire(import.meta.url)(file),inputs={seed:23,samples:100,noiseMeters:.05};
 const noisy=runSensorUncertainty(inputs),zero=runSensorUncertainty({...inputs,noiseMeters:0});assert.deepEqual(noisy,runSensorUncertainty(inputs));assert(noisy.summary.span>0);assert.equal(zero.summary.span,0);assert.equal(zero.summary.mean,1.5);assert(noisy.trace.every(state=>state.pose.x===noisy.world.start.x&&!state.collision));
 const allMissing=describeEnteredMeasurements({referenceMeters:1.5,readings:[null,null]});assert.equal(allMissing.summary.mean,null);assert.equal(allMissing.origin,'learner-entered');
 const paths=['packages/content/sensor-uncertainty.ts','packages/content/repeatable-experiment.ts','packages/simulator/index.ts','packages/simulator/ray.ts'];const sourceHashes={};for(const p of paths)sourceHashes[p]=createHash('sha256').update(await readFile(p)).digest('hex');
 await mkdir('evidence/sensor-uncertainty',{recursive:true});await writeFile('evidence/sensor-uncertainty/traces.json',JSON.stringify({scope:'Actual stationary simulator; manual all-missing control is not physical evidence',sourceHashes,noisy,zero,allMissing},null,2));console.log('Actual stationary noise, zero-noise control, seeded replay and missing-value provenance verified.');
}finally{await rm(file,{force:true});}
