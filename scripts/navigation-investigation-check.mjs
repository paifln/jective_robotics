import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const bundle=await build({stdin:{contents:"export {runNavigationInvestigation} from './packages/content/navigation-investigation';export {InvestigationReportSchema} from './packages/content/investigation-report';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',write:false});
const module={exports:{}};
// Only known local source is compiled here; no imported reports or learner source are executed.
new Function('module','exports','require',bundle.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));
const {runNavigationInvestigation,InvestigationReportSchema}=module.exports;
const inputs={seed:9,repetitions:2,steps:300,noiseMeters:.03,worlds:['clear','wall','narrow']};
const report=InvestigationReportSchema.parse(runNavigationInvestigation(inputs));assert.deepEqual(InvestigationReportSchema.parse(runNavigationInvestigation(inputs)),report);assert.equal(report.trials.length,6);
await mkdir('evidence/navigation-investigation',{recursive:true});await writeFile('evidence/navigation-investigation/traces.json',JSON.stringify(report,null,2));
const hashes={};for(const file of ['packages/content/navigation-investigation.ts','packages/content/investigation-report.ts','packages/content/investigation-worker.ts','packages/content/repeatable-experiment.ts','packages/simulator/index.ts'])hashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
await writeFile('evidence/navigation-investigation/model-verification.json',JSON.stringify({recordedAt:new Date().toISOString(),scope:'Known supported block strategies; three fixed worlds; paired seeds; actual RobotSimulation traces. Report validation checks consistency, not independent physical correctness.',inputs,trials:report.trials.length,repeatedReportMatches:true,physicalVerification:'NOT RUN',sourceHashes:hashes},null,2));console.log('Six paired trials saved; repeated report matches. Physical verification NOT RUN.');
