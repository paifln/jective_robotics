import {it,expect} from 'vitest';
import {runPerformanceImprovement,measurePerformanceRun,performanceAcceptance} from '../packages/content/performance-improvement';
import {performanceImprovementArtifact} from '../packages/content/performance-improvement';
import {performanceImprovementLesson} from '../packages/content/lesson-performance-improvement';
import {performanceImprovementExercise} from '../packages/content/performance-improvement-learning';
import {lessons,artifacts} from '../packages/content/lessons';
import {gradeActivity} from '../packages/content/learning-activities';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {RobotSimulation} from '../packages/simulator';

it('registers full L58, preserves checked conclusions in backup and runs both Studio artifacts to completion',async()=>{
 expect(lessons.find(l=>l.id==='L58')).toEqual(performanceImprovementLesson);expect(artifacts.L58).toEqual(performanceImprovementArtifact);for(const locale of ['en','ru','kk'] as const)expect(performanceImprovementLesson.explanation[locale].split('\n\n')).toHaveLength(6);expect(gradeActivity(performanceImprovementExercise,{selection:['fixed','single','tradeoff','physical']}).state).toBe('needs-practice');
 const root=await mkdtemp(join(tmpdir(),'jective-performance-record-')),source=new WorkspaceStore(join(root,'source.sqlite')),target=new WorkspaceStore(join(root,'target.sqlite'));try{source.saveLearning({id:'L58',answers:{selection:['physical']},check:true});const record=source.saveLearning({id:'L58',answers:{selection:['fixed','single','tradeoff']},check:true});expect(record).toMatchObject({state:'checked',attempts:2});await source.backup(join(root,'backup.sqlite'));populateBackup(target,inspectBackup(join(root,'backup.sqlite')));expect(target.learning('L58')).toEqual(record);}finally{source.close();target.close();await rm(root,{recursive:true,force:true});}
 for(const program of [performanceImprovementArtifact.starter,performanceImprovementArtifact.reference]){const simulation=new RobotSimulation(program,performanceImprovementArtifact.world!);for(let tick=0;tick<1100&&!['completed','error'].includes(simulation.state.status);tick++)simulation.step();expect(simulation.state.status).toBe('completed');expect(simulation.state.collision).toBe(false);}
});

it('runs paired before/after trials, changes one parameter and retains fixed accuracy/time acceptance',()=>{
 const r=runPerformanceImprovement({turnMs:1180,justification:'The initial turns undershoot a right angle; increase only turn duration.'});expect(r.before.passed).toBe(false);expect(r.after.passed).toBe(true);expect(r.justifiedImprovement).toBe(true);expect(r.comparison.sameWorld).toBe(true);expect(r.comparison.onlyTurnDurationChanged).toBe(true);expect(r.comparison.extraTimeMs).toBe(720);expect(r.acceptance).toEqual(performanceAcceptance);expect(r.baseline.rows).toHaveLength(3);expect(r.revision.rows).toHaveLength(3);expect(r.after.maximumCornerErrorRadians).toBeLessThan(.05);expect(r.physicalVerification).toBe('NOT RUN');
});
it('does not award an improvement for an unchanged or inaccurate candidate, regardless of justification',()=>{
 for(const turnMs of [1000,400,2000])expect(runPerformanceImprovement({turnMs,justification:'I claim this is a better program without actual supporting results.'}).justifiedImprovement).toBe(false);for(const input of [{turnMs:1181,justification:'long enough text'},{turnMs:1180,justification:'short'},{turnMs:1180,justification:'long enough text',acceptance:{endpointErrorMeters:99}}])expect(()=>runPerformanceImprovement(input)).toThrow();
});
it('derives measurements from traces, ignores fabricated summaries and rejects corrupted samples/phase evidence',()=>{
 const r=runPerformanceImprovement({turnMs:1180,justification:'Increase turn duration based on recorded angular undershoot.'}),changed={...structuredClone(r.revision),summary:{...r.revision.summary}};changed.summary.meanEndpointErrorMeters=999;changed.rows[0]!.endpointErrorMeters=999;expect(measurePerformanceRun(changed)).toEqual(r.after);changed.rows[0]!.trace.at(-1)!.collision=true;expect(measurePerformanceRun(changed).passed).toBe(false);const missing=structuredClone(r.revision);missing.rows[0]!.trace=missing.rows[0]!.trace.filter(s=>s.timeMs!==1200);expect(()=>measurePerformanceRun(missing)).toThrow();const duplicate=structuredClone(r.revision);duplicate.rows[1]!.trial=1;expect(()=>measurePerformanceRun(duplicate)).toThrow('PERFORMANCE_TRIAL_IDS');expect(()=>measurePerformanceRun({})).toThrow();
});
