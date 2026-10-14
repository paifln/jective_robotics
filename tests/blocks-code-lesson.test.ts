import {describe,it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {blocksCodeArtifact,blocksCodeExercise,blocksCodeWalkthrough} from '../packages/content/blocks-code';
import {gradeActivity} from '../packages/content/learning-activities';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
describe('L37 student mapping',()=>{
 it('connects actual generated instructions to includes, setup and loop',()=>{
  const report=blocksCodeWalkthrough();expect(report.entries.map(e=>[e.id,e.section])).toEqual([['library','includes'],['serial','setup'],['ready','setup'],['tick','loop'],['wait','loop']]);
  for(const entry of report.entries)expect(report.source.split('\n')[entry.line-1]!.trim()).toBe(entry.code);
  expect(report.entries.find(e=>e.id==='ready')!.code).toBe('Serial.println("BOOT ONCE");');expect(report.entries.find(e=>e.id==='wait')!.code).toBe('delay(500);');
 });
 it('rejects a missing source marker instead of inventing a mapping line',()=>{
  const original=blocksCodeArtifact.starter;try{blocksCodeArtifact.starter={setup:[],loop:[]};expect(()=>blocksCodeWalkthrough()).toThrow('L37_SOURCE_MAPPING_MISSING');}finally{blocksCodeArtifact.starter=original;}
 });
 it('marks partial and wrong answers and grants only mapping assessment',()=>{
  expect(gradeActivity(blocksCodeExercise,{})).toMatchObject({state:'incomplete',correct:0,total:5});
  expect(gradeActivity(blocksCodeExercise,{...blocksCodeExercise.correct,serial:'loop'})).toMatchObject({state:'needs-practice',correct:4,total:5});
  expect(gradeActivity(blocksCodeExercise,blocksCodeExercise.correct)).toMatchObject({state:'checked',correct:5,total:5});
 });
 it('persists drafts and assessed mapping separately and restores validated backups',async()=>{
  const root=await mkdtemp(join(tmpdir(),'jective-l37-'));let store=new WorkspaceStore(join(root,'source.sqlite'));const restored=new WorkspaceStore(join(root,'restore.sqlite'));try{
   expect(store.learning('L37')).toBeNull();expect(store.saveLearning({id:'L37',answers:{library:'loop'},check:false})).toMatchObject({state:'draft',attempts:0});
   expect(store.saveLearning({id:'L37',answers:{...blocksCodeExercise.correct,library:'loop'},check:true})).toMatchObject({state:'needs-practice',attempts:1});
   const checked=store.saveLearning({id:'L37',answers:blocksCodeExercise.correct,check:true});expect(checked).toMatchObject({state:'checked',attempts:2});
   store.close();store=new WorkspaceStore(join(root,'source.sqlite'));expect(store.learning('L37')).toEqual(checked);await store.backup(join(root,'backup.sqlite'));populateBackup(restored,inspectBackup(join(root,'backup.sqlite')));expect(restored.learning('L37')).toEqual(checked);
   store.db.prepare('UPDATE settings SET value=? WHERE key=?').run('{"state":"checked","attempts":0}','learning:L37');await store.backup(join(root,'malformed.sqlite'));expect(()=>inspectBackup(join(root,'malformed.sqlite'))).toThrow();
  }finally{store.close();restored.close();await rm(root,{recursive:true,force:true});}
 });
});
