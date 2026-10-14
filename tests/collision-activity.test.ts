import {it,expect} from 'vitest';
import {collisionExercise} from '../packages/content/collision-activity';
import {gradeActivity} from '../packages/content/learning-activities';
import {nextLearningRecord} from '../packages/content/learning-records';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
const correct={wall:'unchecked',gap:'clearance',range:'validity',start:'geometry'};
it('distinguishes body clearance, feedback, unavailable distance and invalid starts',()=>{
  expect(gradeActivity(collisionExercise,{}).state).toBe('incomplete');
  for(const key of Object.keys(correct))expect(gradeActivity(collisionExercise,{...correct,[key]:'unknown'})).toEqual({state:'needs-practice',correct:3,total:4});
  const first=nextLearningRecord({id:'L45',answers:{...correct,gap:'validity'},check:true},null);
  const checked=nextLearningRecord({id:'L45',answers:correct,check:true},first);
  expect(checked.state).toBe('checked');expect(checked.attempts).toBe(2);
});
it('preserves checked failure-analysis answers through SQLite backup and restore',async()=>{
  const root=await mkdtemp(join(tmpdir(),'jective-collision-answers-')),store=new WorkspaceStore(join(root,'source.sqlite'));
  try{
    const saved=store.saveLearning({id:'L45',answers:correct,check:true});await store.backup(join(root,'backup.sqlite'));
    const restored=new WorkspaceStore(join(root,'restored.sqlite'));
    try{populateBackup(restored,inspectBackup(join(root,'backup.sqlite')));expect(restored.learning('L45')).toEqual(saved);expect(saved.state).toBe('checked');}finally{restored.close();}
  }finally{store.close();if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-collision-answers-'))throw new Error('Unexpected cleanup path');await rm(root,{recursive:true,force:true});}
});
