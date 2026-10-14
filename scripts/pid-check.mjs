import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
await mkdir('test-results/pid',{recursive:true});
await build({entryPoints:['packages/content/pid-experiment.ts','packages/content/wheel-speed-experiment.ts'],outdir:'test-results/pid',bundle:true,platform:'node',format:'cjs',outExtension:{'.js':'.cjs'}});
const {comparePid,pidTrial}=await import('../test-results/pid/pid-experiment.cjs');
const {compareWheelSpeed}=await import('../test-results/pid/wheel-speed-experiment.cjs');
const previous=JSON.parse(await readFile('evidence/wheel-speed/responses.json','utf8'));
let comparedRows=0;
for(const before of previous.cases){const after=compareWheelSpeed(400,.55,before.caseId);for(const name of ['openLoop','closedLoop']){const serialized=JSON.parse(JSON.stringify(after[name]));if(!isDeepStrictEqual(before[name].rows,serialized.rows)||!isDeepStrictEqual(before[name].metrics,serialized.metrics)){for(let i=0;i<serialized.rows.length;i++)for(const key of Object.keys(before[name].rows[i]))if(before[name].rows[i][key]!==serialized.rows[i][key])console.log({caseId:before.caseId,name,index:i,key,before:before[name].rows[i][key],after:serialized.rows[i][key]});throw new Error('L32_REFACTOR_CHANGED_RESPONSE');}comparedRows+=after[name].rows.length;}}
const cases=['load-change','feedback-loss','manual-stop'].map(caseId=>({caseId,...comparePid(400,300,10,.55,caseId)}));
const protection={conditional:pidTrial({kp:400,ki:300,kd:10},.3),clampOnly:pidTrial({kp:400,ki:300,kd:10},.3,'load-change',undefined,false)};
const sourceHashes={};for(const path of ['packages/simulator/wheel-speed.ts','packages/simulator/wheel-bench.ts','packages/simulator/pid.ts','packages/content/wheel-speed-experiment.ts','packages/content/pid-experiment.ts','packages/content/lesson-pid.ts','packages/content/lessons.ts','packages/content/knowledge-check.ts','apps/desktop/renderer/PidPanel.tsx','apps/desktop/renderer/ContentPanel.tsx','tests/pid.test.ts','tests/e2e/pid.spec.ts','scripts/pid-check.mjs'])sourceHashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
await mkdir('evidence/pid',{recursive:true});
await writeFile('evidence/pid/responses.json',JSON.stringify({cases,protection},null,2));
await writeFile('evidence/pid/verification.json',JSON.stringify({status:'DOMAIN VERIFIED; L33 AUTHORED DRAFT; UNPACKAGED SOURCE',sourceHashes,l32Refactor:{comparedRows,rowsAndMetricsIdentical:true},metrics:cases.map(item=>({caseId:item.caseId,p:item.p.metrics,pi:item.pi.metrics,pid:item.pid.metrics})),protectionMetrics:{conditional:protection.conditional.metrics,clampOnly:protection.clampOnly.metrics},scope:'Same quantized first-order wheel plant. Conditional integration plus integral clamp versus clamp alone. No general PID superiority or physical test claim.',physicalVerification:'NOT RUN'},null,2));
console.log(JSON.stringify({comparedRows,metrics:cases[0].pid.metrics,protection:{conditional:protection.conditional.metrics,clampOnly:protection.clampOnly.metrics}},null,2));
