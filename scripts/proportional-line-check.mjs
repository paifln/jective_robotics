import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('test-results/proportional-line',{recursive:true});
await build({entryPoints:['packages/content/proportional-line.ts'],outfile:'test-results/proportional-line/model.cjs',bundle:true,platform:'node',format:'cjs'});
const {compareProportionalTrials,proportionalCorrection}=await import('../test-results/proportional-line/model.cjs');
const trials=compareProportionalTrials([1,8,40]);
for(const trial of trials){if(trial.trace.at(-1).status!=='completed'||trial.trace.some(frame=>frame.collision)||trial.commands.some(command=>Math.abs(command.correction)>30||Math.abs(command.left)>50||Math.abs(command.right)>50))throw new Error('LINE_P_EVIDENCE');}
const sourceHashes={};for(const path of ['packages/content/proportional-line.ts','packages/content/lesson-proportional-line.ts','packages/content/lessons.ts','packages/content/knowledge-check.ts','apps/desktop/renderer/ProportionalLinePanel.tsx','apps/desktop/renderer/ContentPanel.tsx','packages/simulator/index.ts','tests/proportional-line.test.ts','tests/e2e/proportional-line.spec.ts','scripts/proportional-line-check.mjs'])sourceHashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
await mkdir('evidence/proportional-line',{recursive:true});
await writeFile('evidence/proportional-line/trials.json',JSON.stringify({trials,declaredArithmetic:[{error:.25,gain:8,correction:proportionalCorrection(.25,8)},{error:-1,gain:40,correction:proportionalCorrection(-1,40)}]},null,2));
await writeFile('evidence/proportional-line/verification.json',JSON.stringify({status:'DOMAIN VERIFIED; L29 AUTHORED DRAFT',sourceHashes,scope:'Three actual binary-reflectance gain trials on identical geometry; separately declared fractional arithmetic, not measured analog noise',metrics:trials.map(trial=>({gain:trial.gain,...trial.metrics})),physicalVerification:'NOT RUN'},null,2));
console.log('Three actual proportional-line trials and source hashes saved.');
