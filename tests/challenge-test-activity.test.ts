import {it,expect} from 'vitest';
import {challengeTestExercise} from '../packages/content/challenge-test-activity';
import {gradeActivity} from '../packages/content/learning-activities';
import {nextLearningRecord} from '../packages/content/learning-records';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
const correct=['conditions','predict','run','inspect','conclude'];
it('checks the test workflow and counts a corrected attempt without accepting outcome-first criteria',()=>{
 if(challengeTestExercise.kind!=='order')throw new Error('Expected ordered workflow');
 expect(challengeTestExercise.items.map(item=>item.id)).not.toEqual(correct);
 expect(gradeActivity(challengeTestExercise,{}).state).toBe('incomplete');const wrong=['run','predict','conditions','inspect','conclude'];expect(gradeActivity(challengeTestExercise,{order:wrong}).state).toBe('needs-practice');expect(gradeActivity(challengeTestExercise,{order:correct.slice(1)}).state).toBe('incomplete');
 const first=nextLearningRecord({id:'L47',answers:{order:wrong},check:true},null),checked=nextLearningRecord({id:'L47',answers:{order:correct},check:true},first);expect(checked.state).toBe('checked');expect(checked.attempts).toBe(2);
});
it('preserves corrected workflow and both attempts through actual SQLite backup and restore',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-test-workflow-')),store=new WorkspaceStore(join(root,'source.sqlite'));
 try{
  store.saveLearning({id:'L47',answers:{order:['run','predict','conditions','inspect','conclude']},check:true});
  const saved=store.saveLearning({id:'L47',answers:{order:correct},check:true});expect(saved.state).toBe('checked');expect(saved.attempts).toBe(2);
  await store.backup(join(root,'backup.sqlite'));const restored=new WorkspaceStore(join(root,'restored.sqlite'));
  try{populateBackup(restored,inspectBackup(join(root,'backup.sqlite')));expect(restored.learning('L47')).toEqual(saved);}finally{restored.close();}
 }finally{store.close();if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-test-workflow-'))throw new Error('Unexpected cleanup path');await rm(root,{recursive:true,force:true});}
});
