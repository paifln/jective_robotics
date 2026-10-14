import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {createBuildErrorProject,buildErrorExercise} from '../packages/content/build-error-learning';
import {buildErrorsLesson} from '../packages/content/lesson-build-errors';
import {lessons} from '../packages/content/lessons';
import {gradeActivity} from '../packages/content/learning-activities';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
import {createBuildReport,BuildReportSchema} from '../packages/toolchain/build-report';
import {readFileSync} from 'node:fs';
it('registers substantive trilingual compiler theory and independent target-specific projects',()=>{
 expect(lessons.find(l=>l.id==='L50')).toEqual(buildErrorsLesson);for(const locale of ['en','ru','kk'] as const){expect(buildErrorsLesson.explanation[locale].split('\n\n')).toHaveLength(6);expect(buildErrorsLesson.explanation[locale].length).toBeGreaterThan(2000);}
 const id='d87fca1a-9a8e-4c38-bd0e-d60ce582f7ca';const bad=createBuildErrorProject('board',false,id,'Fault'),good=createBuildErrorProject('board',true,id,'Fixed');expect(bad.source).toBe(good.source);expect(bad.profileId).toBe('esp32c3-reference');expect(good.profileId).toBe('esp32-devkit-reference');expect(bad.wiring).toBeUndefined();expect(bad.sourceFiles).toBeUndefined();expect(bad.lessonId).toBe('L50');expect(()=>createBuildErrorProject('unknown' as 'board',false,id,'Bad')).toThrow('BUILD_ERROR_CASE_INVALID');expect(()=>createBuildErrorProject('symbol',false,'../bad','Bad')).toThrow();
});
it('checks causes separately from compilation and restores actual saved attempts through SQLite backup',async()=>{
 const correct={symbol:'declaration',type:'field',library:'header',board:'profile',proof:'compiled'};expect(gradeActivity(buildErrorExercise,{}).state).toBe('incomplete');expect(gradeActivity(buildErrorExercise,{...correct,proof:'profile'})).toEqual({state:'needs-practice',correct:4,total:5});expect(gradeActivity(buildErrorExercise,correct).state).toBe('checked');
 const root=await mkdtemp(join(tmpdir(),'jective-L50-')),store=new WorkspaceStore(join(root,'workspace.sqlite'));try{store.saveLearning({id:'L50',answers:{...correct,proof:'profile'},check:true});const record=store.saveLearning({id:'L50',answers:correct,check:true});expect(record.attempts).toBe(2);const path=join(root,'backup.sqlite');await store.backup(path);const restored=new WorkspaceStore(join(root,'restored.sqlite'));try{populateBackup(restored,inspectBackup(path));expect(restored.learning('L50')).toEqual(record);}finally{restored.close();}}finally{store.close();const target=resolve(root);if(!target.startsWith(resolve(tmpdir())+sep)||!target.split(sep).at(-1)!.startsWith('jective-L50-'))throw new Error('CLEANUP_TARGET');await rm(target,{recursive:true,force:true});}
});
it('exports recorded genuine compiler inputs and results without converting a successful build into upload proof',()=>{
 const receipt=JSON.parse(readFileSync('evidence/build-errors/compiler.json','utf8'));
 for(const entry of receipt.results){for(const [project,build] of [[entry.starter,entry.bad],[entry.corrected,entry.good]]){const report=createBuildReport(project,build,'2026-10-11T10:00:00.000Z');expect(BuildReportSchema.parse(JSON.parse(JSON.stringify(report)))).toEqual(report);expect(report.project.source).toBe(project.source);expect(report.profile.id).toBe(project.profileId);expect(report.profile.fqbn).toBe(project.profileId==='esp32c3-reference'?'esp32:esp32:esp32c3':'esp32:esp32:esp32');expect(()=>BuildReportSchema.parse({...report,profile:{...report.profile,id:'other'}})).toThrow('BUILD_REPORT_PROFILE_MISMATCH');expect(report.build.log).toBe(build.log);expect(report.uploadVerification).toContain('NOT RUN');expect(report.physicalVerification).toContain('NOT RUN');project.source='subsequent edit';expect(report.project.source).not.toBe(project.source);}}
 expect(()=>BuildReportSchema.parse({origin:'physical-certified'})).toThrow();
});
