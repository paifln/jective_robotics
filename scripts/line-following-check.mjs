import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('test-results/line-following',{recursive:true});
await build({entryPoints:['packages/content/line-following-experiment.ts'],outfile:'test-results/line-following/model.cjs',bundle:true,platform:'node',format:'cjs'});
const {runLineCase,lineCases}=await import('../test-results/line-following/model.cjs');
const cases=lineCases.map(caseId=>runLineCase(caseId)),starter=runLineCase('centered',false);
for(const report of cases){if(report.expected!==report.caseId||report.trace.at(-1).status!=='completed'||report.trace.some(frame=>frame.collision)||report.stopRequestMs===null||report.settledStopMs===null||report.settledStopMs-report.stopRequestMs>100)throw new Error('LINE_CASE_EVIDENCE');}
const sourceHashes={};for(const path of ['packages/content/line-following.ts','packages/content/line-following-artifact.ts','packages/content/line-following-experiment.ts','packages/content/lesson-line-following.ts','packages/content/lessons.ts','packages/content/knowledge-check.ts','apps/desktop/renderer/LineFollowingPanel.tsx','apps/desktop/renderer/ContentPanel.tsx','packages/simulator/index.ts','tests/line-following.test.ts','tests/e2e/line-following.spec.ts','scripts/line-following-check.mjs'])sourceHashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
await mkdir('evidence/line-following',{recursive:true});
await writeFile('evidence/line-following/traces.json',JSON.stringify({cases,starter},null,2));
await writeFile('evidence/line-following/verification.json',JSON.stringify({status:'DOMAIN VERIFIED; L28 AUTHORED DRAFT',sourceHashes,scope:'Actual four geometry fixtures and finite-line loss response; no arbitrary-course or physical tracking claim',cases:cases.map(report=>({caseId:report.caseId,initial:report.initial,expected:report.expected,stopRequestMs:report.stopRequestMs,settledStopMs:report.settledStopMs})),physicalVerification:'NOT RUN'},null,2));
console.log('Four actual line-following fixtures and source hashes saved.');
