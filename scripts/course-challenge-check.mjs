import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('test-results/course-challenge',{recursive:true});
await build({entryPoints:['packages/content/course-challenge.ts'],outfile:'test-results/course-challenge/model.cjs',bundle:true,platform:'node',format:'cjs'});
const {repeatCourse,courseCases,runCourse}=await import('../test-results/course-challenge/model.cjs');
const cases=courseCases.map(caseId=>repeatCourse(caseId)),unsafe=runCourse('obstacle',false);
for(const group of cases){if(group.endpointRangeMeters!==0||group.runs.some(run=>run.trace.at(-1).status!=='completed'||run.outcome.collision||run.outcome.coursePassed!==(group.caseId==='clear')))throw new Error('COURSE_EVIDENCE');for(const run of group.runs.slice(1))if(JSON.stringify(run.trace)!==JSON.stringify(group.runs[0].trace))throw new Error('COURSE_REPEAT_TRACE');}
if(!unsafe.outcome.collision)throw new Error('COURSE_UNSAFE_CONTROL');
const sourceHashes={};for(const path of ['packages/content/course-challenge.ts','packages/content/lesson-course-challenge.ts','packages/content/proportional-line.ts','packages/content/lessons.ts','packages/content/knowledge-check.ts','apps/desktop/renderer/CourseChallengePanel.tsx','apps/desktop/renderer/ContentPanel.tsx','packages/simulator/index.ts','packages/simulator/ray.ts','packages/codegen/index.ts','tests/course-challenge.test.ts','tests/e2e/course-challenge.spec.ts','scripts/course-challenge-check.mjs'])sourceHashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
await mkdir('evidence/course-challenge',{recursive:true});
await writeFile('evidence/course-challenge/traces.json',JSON.stringify({cases,unsafe},null,2));
await writeFile('evidence/course-challenge/verification.json',JSON.stringify({status:'DOMAIN VERIFIED; L30 AUTHORED DRAFT',sourceHashes,scope:'Five actual fixtures with three full repeat traces each; unsafe wall case retains collision history. Finish gate uses simulator ground truth, not physical odometry',results:cases.map(group=>({caseId:group.caseId,endpointRangeMeters:group.endpointRangeMeters,outcome:group.runs[0].outcome})),physicalVerification:'NOT RUN'},null,2));
console.log('Five course fixtures, repeated actual traces and source hashes saved.');
