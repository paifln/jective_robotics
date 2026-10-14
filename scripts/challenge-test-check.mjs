import {build} from 'esbuild';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
await mkdir('.verification',{recursive:true});const file=resolve('.verification/challenge-test-'+randomUUID()+'.cjs'),guard=relative(resolve('.verification'),file);assert(!guard.startsWith('..')&&!isAbsolute(guard));const bundle=await build({entryPoints:['packages/content/challenge-test.ts'],bundle:true,platform:'node',format:'cjs',write:false});await writeFile(file,bundle.outputFiles[0].contents,{flag:'wx'});
try{
 const {evaluateChallenge,challengeTestWorld,challengeTestPrograms}=createRequire(import.meta.url)(file),criteria={world:challengeTestWorld,timeoutMs:6000,requireGoal:true,forbidCollisions:true};
 const passing=evaluateChallenge(challengeTestPrograms.passing,criteria),failing=evaluateChallenge(challengeTestPrograms.failing,criteria);assert(passing.passed);assert(!failing.passed);assert.equal(passing.reason,'goal-reached');assert.equal(failing.reason,'timeout');assert.deepEqual(passing.criteria,failing.criteria);assert.deepEqual(passing,evaluateChallenge(challengeTestPrograms.passing,criteria));
 const sourceHashes={};for(const p of ['packages/content/challenge-test.ts','packages/simulator/index.ts','packages/simulator/world-schema.ts'])sourceHashes[p]=createHash('sha256').update(await readFile(p)).digest('hex');
 await mkdir('evidence/challenge-test',{recursive:true});await writeFile('evidence/challenge-test/traces.json',JSON.stringify({scope:'Actual supported block model evaluated against one identical scenario; not physical verification',sourceHashes,passing,failing},null,2));console.log('Passing and failing supported programs evaluated against identical goal/time/collision criteria; actual traces retained.');
}finally{await rm(file,{force:true});}
