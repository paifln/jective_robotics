import {it,expect} from 'vitest';
import {inspectIntegratedTrace,runIntegratedPrototype,integratedPrototypeArtifact} from '../packages/content/integrated-prototype';
import {RobotSimulation} from '../packages/simulator';
import {integratedPrototypeLesson} from '../packages/content/lesson-integrated-prototype';
import {integratedPrototypeExercise} from '../packages/content/integrated-prototype-learning';
import {lessons,artifacts} from '../packages/content/lessons';
import {gradeActivity} from '../packages/content/learning-activities';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
it('registers trilingual L56 with the exact runnable model artifact and preserves checked reasoning through SQLite backup',async()=>{
 expect(lessons.find(l=>l.id==='L56')).toEqual(integratedPrototypeLesson);expect(artifacts.L56).toEqual(integratedPrototypeArtifact);
 for(const locale of ['en','ru','kk'] as const)expect(integratedPrototypeLesson.explanation[locale].split('\n\n')).toHaveLength(6);
 expect(gradeActivity(integratedPrototypeExercise,{selection:['model','physical','latched','reports']}).state).toBe('needs-practice');
 const root=await mkdtemp(join(tmpdir(),'jective-integration-learning-')),source=new WorkspaceStore(join(root,'source.sqlite')),target=new WorkspaceStore(join(root,'target.sqlite'));
 try{source.saveLearning({id:'L56',answers:{selection:['physical']},check:true});const record=source.saveLearning({id:'L56',answers:{selection:['model','latched','reports']},check:true});expect(record).toMatchObject({state:'checked',attempts:2});await source.backup(join(root,'backup.sqlite'));populateBackup(target,inspectBackup(join(root,'backup.sqlite')));expect(target.learning('L56')).toEqual(record);}
 finally{source.close();target.close();await rm(root,{recursive:true,force:true});}
});
it('executes four actual component/integration scenarios with complete trace and honest model boundaries',()=>{
 const report=runIntegratedPrototype();expect(report.passed).toBe(true);expect(report.cases).toHaveLength(4);
 for(const entry of report.cases){expect(entry.review.checks).toEqual({sensing:true,decision:true,actuation:true,telemetry:true});expect(entry.experiment.trace.at(-1)!.status).toBe('completed');}
 const loss=report.cases.find(c=>c.scenario==='lost-then-restored')!;expect(loss.review.latchedAtMs).toBe(220);expect(loss.review.settledAtMs).toBeGreaterThan(loss.review.latchedAtMs!);expect(loss.experiment.trace.at(-1)!.distanceStatus).toBe('valid');expect(loss.experiment.trace.at(-1)!.variables.stopped).toBe(1);
 expect(report.physicalVerification).toBe('NOT RUN');expect(report.compilation).toContain('NOT RUN');
});
it('makes the missing validity guard fail actual integration and preserves the same Studio starter/reference behavior',()=>{
 const report=runIntegratedPrototype(.3,false);expect(report.passed).toBe(false);const loss=report.cases.find(c=>c.scenario==='lost-then-restored')!;expect(loss.review.status).toBe('error');expect(loss.review.checks.decision).toBe(false);expect(loss.review.checks.actuation).toBe(false);
 for(const [program,status] of [[integratedPrototypeArtifact.starter,'error'],[integratedPrototypeArtifact.reference,'completed']] as const){const simulation=new RobotSimulation(program,integratedPrototypeArtifact.world!);for(let tick=0;tick<150&&!['error','completed'].includes(simulation.state.status);tick++)simulation.step();expect(simulation.state.status).toBe(status);}
});
it('rejects malformed histories and exposes corrupted observations rather than reporting canned pass labels',()=>{
 const report=runIntegratedPrototype(),ray=report.cases.find(c=>c.scenario==='ray-obstacle')!,trace=structuredClone(ray.experiment.trace);
 trace.at(-1)!.log=[];expect(inspectIntegratedTrace(trace,'ray-obstacle').checks.telemetry).toBe(false);
 trace.at(-1)!.collision=true;expect(inspectIntegratedTrace(trace,'ray-obstacle').checks.actuation).toBe(false);
 trace.at(-1)!.variables.stopped=0;expect(inspectIntegratedTrace(trace,'ray-obstacle').checks.decision).toBe(false);
 trace[0]!.distanceSource='injected';expect(inspectIntegratedTrace(trace,'ray-obstacle').checks.sensing).toBe(false);
 expect(()=>inspectIntegratedTrace([],'far')).toThrow();expect(()=>inspectIntegratedTrace(ray.experiment.trace,'unknown')).toThrow();expect(()=>inspectIntegratedTrace([trace[0],trace[0]],'far')).toThrow();
 for(const threshold of [.19,.81,NaN])expect(()=>runIntegratedPrototype(threshold)).toThrow('OBSTACLE_STOP_CONFIG');
});
