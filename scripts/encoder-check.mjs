import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('test-results/encoder',{recursive:true});
await build({entryPoints:['packages/content/encoder-experiment.ts','packages/simulator/encoder.ts'],outbase:'packages',outdir:'test-results/encoder',bundle:true,platform:'node',format:'cjs'});
const {encoderMotionExperiment,decodeEncoderSamples}=await import('../test-results/encoder/content/encoder-experiment.js');
const {QuadratureEncoder}=await import('../test-results/encoder/simulator/encoder.js');
const models=[.6,.5].map(speed=>encoderMotionExperiment(undefined,speed));
for(const model of models){const resolution=model.config.wheelCircumferenceMeters/model.config.countsPerWheelRevolution;if(model.trace.at(-1).status!=='completed'||model.trace.some(frame=>frame.collision)||!model.rows.some(row=>row.left.deltaCount<0)||model.rows.some(row=>Math.abs(row.left.distanceSinceResetMeters-row.modeledLeftTravelMeters)>resolution+1e-12))throw new Error('ENCODER_MODEL_EVIDENCE');}
const decoder=new QuadratureEncoder(),levels=[[false,false],[false,true],[true,true],[true,false],[false,false],[true,false],[true,true],[false,true],[false,false]];
const quadrature=levels.map(([a,b],index)=>({a,b,...decoder.edge(index*20000,a,b)}));
const tables={ordinary:decodeEncoderSamples('0,0,0\n20,180,0\n40,360,0'),wrap:decodeEncoderSamples('0,65534,0\n20,1,0\n40,65535,0'),reset:decodeEncoderSamples('0,500,0\n20,680,0\n40,0,1\n60,180,1')};
const sourceHashes={};for(const path of ['packages/simulator/encoder.ts','packages/content/encoder-experiment.ts','packages/content/lesson-encoder.ts','packages/content/lessons.ts','packages/content/knowledge-check.ts','packages/content/guides.ts','apps/desktop/renderer/EncoderPanel.tsx','apps/desktop/renderer/ContentPanel.tsx','packages/simulator/index.ts','packages/codegen/index.ts','tests/encoder.test.ts','tests/e2e/encoder.spec.ts','scripts/encoder-check.mjs'])sourceHashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
await mkdir('evidence/encoder',{recursive:true});
await writeFile('evidence/encoder/samples.json',JSON.stringify({models,declaredQuadrature:{origin:'declared-level-sequence',quadrature},learnerTableExamples:tables},null,2));
await writeFile('evidence/encoder/verification.json',JSON.stringify({status:'DOMAIN VERIFIED; L31 AUTHORED DRAFT',sourceHashes,scope:'Transport-neutral count and quadrature decoding; declared tables and quantization of actual modeled wheel travel, not physical signal acquisition',models:models.map(model=>({maximumSpeedMps:model.maximumSpeedMps,final:model.rows.at(-1),noEncoderAlternative:model.noEncoderAlternative})),physicalVerification:'NOT RUN'},null,2));
console.log('Encoder model traces, declared examples and source hashes saved.');
