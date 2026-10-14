import {it,expect} from 'vitest';
import {runReliabilityReview,runReliabilityCases,resetExperiment,inspectReset,inspectCommunicationLoss,inspectObstacleFault,blockedMovementExperiment} from '../packages/content/reliability-review';
import {motorSafetyExperiment} from '../packages/simulator/safe-motor';
import {reliabilityReviewArtifact} from '../packages/content/reliability-review';
import {reliabilityReviewLesson} from '../packages/content/lesson-reliability-review';
import {reliabilityReviewExercise} from '../packages/content/reliability-review-learning';
import {lessons,artifacts} from '../packages/content/lessons';
import {gradeActivity} from '../packages/content/learning-activities';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {RobotSimulation} from '../packages/simulator';

it('registers substantive L57, preserves checked matching through SQLite backup and runs the exact Studio pair',async()=>{
 expect(lessons.find(l=>l.id==='L57')).toEqual(reliabilityReviewLesson);expect(artifacts.L57).toEqual(reliabilityReviewArtifact);for(const locale of ['en','ru','kk'] as const)expect(reliabilityReviewLesson.explanation[locale].split('\n\n')).toHaveLength(6);
 const correct={communication:'authority',reset:'startup',reading:'validity',blocked:'geometry'};expect(gradeActivity(reliabilityReviewExercise,{...correct,blocked:'validity'}).state).toBe('needs-practice');expect(gradeActivity(reliabilityReviewExercise,correct).state).toBe('checked');
 const root=await mkdtemp(join(tmpdir(),'jective-reliability-record-')),source=new WorkspaceStore(join(root,'source.sqlite')),target=new WorkspaceStore(join(root,'target.sqlite'));try{source.saveLearning({id:'L57',answers:{...correct,blocked:'validity'},check:true});const record=source.saveLearning({id:'L57',answers:correct,check:true});expect(record.attempts).toBe(2);await source.backup(join(root,'backup.sqlite'));populateBackup(target,inspectBackup(join(root,'backup.sqlite')));expect(target.learning('L57')).toEqual(record);}finally{source.close();target.close();await rm(root,{recursive:true,force:true});}
 for(const [program,status] of [[reliabilityReviewArtifact.starter,'error'],[reliabilityReviewArtifact.reference,'completed']] as const){const simulation=new RobotSimulation(program,reliabilityReviewArtifact.world!);for(let tick=0;tick<150&&!['error','completed'].includes(simulation.state.status);tick++)simulation.step();expect(simulation.state.status).toBe(status);}
});

it('executes four fault cases, preserves actual defects and retests all four with separate model limits',()=>{
 const r=runReliabilityReview();expect(r.initial.map(c=>[c.id,c.review.passed])).toEqual([['communication-loss',true],['reset',true],['invalid-reading',false],['blocked-movement',false]]);expect(r.retest.every(c=>c.review.passed)).toBe(true);expect(r.issues.map(i=>i.id)).toEqual(['invalid-reading','blocked-movement']);expect(r.issues.every(i=>i.retest.passed&&i.scope==='model-only')).toBe(true);expect(r.physicalVerification).toBe('NOT RUN');expect(r.initial[2]!.experiment.trace!.at(-1)!.status).toBe('error');expect(r.initial[3]!.review.collision).toBe(true);
});
it('requires observed timeout and reset-safe states rather than trusting result summaries',()=>{
 const communication=motorSafetyExperiment('communication-loss');expect(inspectCommunicationLoss(communication.samples)).toEqual({passed:true,safeAtMs:400});expect(inspectCommunicationLoss(communication.samples.filter(s=>s.timeMs!==400)).passed).toBe(false);const changed=structuredClone(communication.samples);changed.at(-1)!.mode='tethered';expect(inspectCommunicationLoss(changed).passed).toBe(false);const reset=resetExperiment();expect(inspectReset(reset).passed).toBe(true);expect(inspectReset({...reset,driveAccepted:true}).passed).toBe(false);reset.afterReset[0]!.left=1;expect(inspectReset(reset).passed).toBe(false);expect(()=>inspectReset({})).toThrow();expect(()=>inspectCommunicationLoss([])).toThrow();
});
it('rejects missing latch/reason, wrong provenance, collisions and invalid configuration',()=>{
 const trace=blockedMovementExperiment(true).trace;expect(inspectObstacleFault(trace,'blocked-movement').passed).toBe(true);for(const change of ['collision','reason','provenance','latch']){const altered=structuredClone(trace);if(change==='collision')altered.at(-1)!.collision=true;if(change==='reason')altered.at(-1)!.log=[];if(change==='provenance')altered[0]!.distanceSource='injected';if(change==='latch')altered.at(-1)!.variables.stopped=0;expect(inspectObstacleFault(altered,'blocked-movement').passed).toBe(false);}expect(()=>runReliabilityCases('yes' as unknown as boolean)).toThrow('RELIABILITY_CONFIG');expect(()=>blockedMovementExperiment(1 as unknown as boolean)).toThrow('RELIABILITY_CONFIG');expect(()=>inspectObstacleFault([],'invalid-reading')).toThrow();
});
