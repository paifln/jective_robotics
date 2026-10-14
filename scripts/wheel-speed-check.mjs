import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('test-results/wheel-speed',{recursive:true});
await build({entryPoints:['packages/content/wheel-speed-experiment.ts'],outfile:'test-results/wheel-speed/model.cjs',bundle:true,platform:'node',format:'cjs'});
const {compareWheelSpeed}=await import('../test-results/wheel-speed/model.cjs');
const cases=['load-change','feedback-loss','manual-stop'].map(caseId=>({caseId,...compareWheelSpeed(400,.55,caseId)}));
for(const result of cases){for(const trial of [result.openLoop,result.closedLoop])if(trial.rows.some(row=>row.commandPercent<0||row.commandPercent>60)||trial.rows[0].estimatedMps!==null||trial.rows[0].commandPercent!==0)throw new Error('WHEEL_SPEED_EVIDENCE');if(result.caseId!=='load-change'&&result.closedLoop.rows.filter(row=>row.timeMs>=3000).some(row=>row.state!=='fault'||row.commandPercent!==0))throw new Error('WHEEL_SPEED_FAULT_LATCH');}
if(cases[0].closedLoop.metrics.loadedMeanAbsoluteErrorMps>=cases[0].openLoop.metrics.loadedMeanAbsoluteErrorMps||cases[0].closedLoop.metrics.loadedMeanAbsoluteErrorMps<=.01)throw new Error('WHEEL_SPEED_RESPONSE');
const sourceHashes={};for(const path of ['packages/simulator/wheel-bench.ts','packages/simulator/wheel-speed.ts','packages/simulator/encoder.ts','packages/content/wheel-speed-experiment.ts','packages/content/encoder-experiment.ts','packages/content/lesson-wheel-speed.ts','packages/content/lessons.ts','packages/content/knowledge-check.ts','apps/desktop/renderer/WheelSpeedPanel.tsx','apps/desktop/renderer/ContentPanel.tsx','packages/simulator/index.ts','packages/codegen/index.ts','tests/wheel-speed.test.ts','tests/e2e/wheel-speed.spec.ts','scripts/wheel-speed-check.mjs'])sourceHashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
await mkdir('evidence/wheel-speed',{recursive:true});
await writeFile('evidence/wheel-speed/responses.json',JSON.stringify({cases},null,2));
await writeFile('evidence/wheel-speed/verification.json',JSON.stringify({status:'DOMAIN VERIFIED; L32 AUTHORED DRAFT',sourceHashes,scope:'Declared first-order wheel load model with quantized counter feedback; separate instantaneous model truth and interval estimates, no physical acquisition or spatial-world load claim',metrics:cases.map(result=>({caseId:result.caseId,openLoop:result.openLoop.metrics,closedLoop:result.closedLoop.metrics})),physicalVerification:'NOT RUN'},null,2));
console.log('Wheel-speed load responses, fault cases and source hashes saved.');
