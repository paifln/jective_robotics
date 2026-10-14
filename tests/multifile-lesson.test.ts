import {describe,it,expect} from 'vitest';
import {predictMultiFilePhase,multiFileExercise,multiFileArtifact} from '../packages/content/multifile-lesson';
import {multiFileLesson} from '../packages/content/lesson-multifile';
import {lessons} from '../packages/content/lessons';
import {createCodeLessonProject} from '../packages/content/code-lesson-project';
import {gradeActivity} from '../packages/content/learning-activities';
import {nextLearningRecord,LearningIdSchema} from '../packages/content/learning-records';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {Project} from '../packages/contracts';
const previous:Project={schemaVersion:1,id:'730993b5-55c7-48e9-a925-67a3c7b73e43',name:'Original',profileId:'esp32-devkit-reference',mode:'blocks',source:'original',workspace:{original:true},revision:5,wiring:{led:4}};
describe('L42 multi-file lesson',()=>{
 it('predicts the same strict boundaries as the compiled phase example and rejects invalid inputs',()=>{
  expect([0,299,300,999,1000,1300].map(elapsedMs=>predictMultiFilePhase({elapsedMs,firstMs:300,secondMs:700}).phase)).toEqual(['FIRST','FIRST','SECOND','SECOND','FIRST','SECOND']);expect(predictMultiFilePhase({elapsedMs:400,firstMs:400,secondMs:600})).toEqual({phase:'SECOND',cycle:1000,position:400});expect(predictMultiFilePhase({elapsedMs:0xffffffff,firstMs:1,secondMs:1}).phase).toBe('SECOND');
  for(const input of [{elapsedMs:-1,firstMs:300,secondMs:700},{elapsedMs:0x100000000,firstMs:300,secondMs:700},{elapsedMs:.5,firstMs:300,secondMs:700},{elapsedMs:0,firstMs:0,secondMs:700},{elapsedMs:0,firstMs:1001,secondMs:700},{elapsedMs:0,firstMs:300,secondMs:NaN},{elapsedMs:0,firstMs:300,secondMs:700,extra:true}])expect(()=>predictMultiFilePhase(input)).toThrow();
 });
 it('registers substantive trilingual theory and genuine separate-file starter/reference artifacts',()=>{
  expect(lessons.find(l=>l.id==='L42')).toEqual(multiFileLesson);for(const locale of ['en','ru','kk'] as const){expect(multiFileLesson.explanation[locale].length).toBeGreaterThan(2000);expect(multiFileLesson.questions).toHaveLength(3);}
  expect(Object.keys(multiFileArtifact.starterFiles)).toEqual(['config.h','behavior.h','behavior.cpp']);expect(multiFileArtifact.starterFiles['behavior.cpp']).toContain('unknownPhase');expect(multiFileArtifact.referenceFiles['behavior.cpp']).not.toContain('unknownPhase');expect(multiFileArtifact.reference).toContain('#include "behavior.h"');expect(multiFileArtifact.reference).not.toContain('const char* phase(');
 });
 it('creates an independent validated complete lesson project while preserving hardware selection',()=>{
  const p=createCodeLessonProject(previous,'L42',multiFileArtifact.starter,multiFileArtifact.starterFiles,'dcb69a2f-f9c8-42d6-8c91-f263497a8253','Lesson');expect(p.mode).toBe('code');expect(p.sourceFiles).toEqual(multiFileArtifact.starterFiles);expect(p.workspace).toEqual({});expect(p.wiring).toEqual(previous.wiring);expect(p.revision).toBe(0);expect(previous.source).toBe('original');p.sourceFiles!['config.h']='changed';expect(multiFileArtifact.starterFiles['config.h']).not.toBe('changed');
  expect(createCodeLessonProject(previous,'L40','single',undefined,p.id,'Single').sourceFiles).toBeUndefined();expect(()=>createCodeLessonProject(previous,'bad','',{},p.id,'Invalid')).toThrow('CODE_LESSON_ID_INVALID');expect(()=>createCodeLessonProject(previous,'L42','',{'../escape.cpp':'bad'},p.id,'Invalid')).toThrow();
 });
 it('grades file responsibilities with adaptive attempts and preserves L42 answers through validated backup',async()=>{
  expect(gradeActivity(multiFileExercise,{}).state).toBe('incomplete');const correct={entry:'main',declaration:'header',implementation:'implementation',settings:'config'};expect(gradeActivity(multiFileExercise,{...correct,settings:'main'})).toEqual({state:'needs-practice',correct:3,total:4});expect(gradeActivity(multiFileExercise,correct).state).toBe('checked');expect(LearningIdSchema.parse('L42')).toBe('L42');expect(()=>LearningIdSchema.parse('L99')).toThrow();expect(nextLearningRecord({id:'L42',answers:correct,check:true},null).attempts).toBe(1);
  const root=await mkdtemp(join(tmpdir(),'jective-L42-'));const store=new WorkspaceStore(join(root,'workspace.sqlite'));try{store.saveLearning({id:'L42',answers:{...correct,settings:'main'},check:true});const saved=store.saveLearning({id:'L42',answers:correct,check:true});expect(saved.attempts).toBe(2);expect(saved.state).toBe('checked');const path=join(root,'backup.sqlite');await store.backup(path);const backup=inspectBackup(path);expect(backup.settings.find(s=>s.key==='learning:L42')).toBeTruthy();const restored=new WorkspaceStore(join(root,'restored.sqlite'));try{populateBackup(restored,backup);expect(restored.learning('L42')).toEqual(saved);}finally{restored.close();}}finally{store.close();await rm(root,{recursive:true,force:true});}
 });
});
