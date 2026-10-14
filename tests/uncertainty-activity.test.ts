import {it,expect} from 'vitest';
import {uncertaintyExercise} from '../packages/content/uncertainty-activity';
import {gradeActivity} from '../packages/content/learning-activities';
import {nextLearningRecord} from '../packages/content/learning-records';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
const correct=['spread','missing','reference','transfer'];
it('rejects unsupported equivalence and accuracy guarantees and counts adaptive attempts',()=>{
 expect(gradeActivity(uncertaintyExercise,{}).state).toBe('incomplete');
 for(const extra of ['guarantee','equivalence','unknown','spread'])expect(gradeActivity(uncertaintyExercise,{selection:[...correct,extra]}).state).toBe('needs-practice');
 expect(gradeActivity(uncertaintyExercise,{selection:correct.slice(1)}).state).toBe('needs-practice');
 const first=nextLearningRecord({id:'L46',answers:{selection:['equivalence']},check:true},null),checked=nextLearningRecord({id:'L46',answers:{selection:correct},check:true},first);
 expect(checked.state).toBe('checked');expect(checked.attempts).toBe(2);
});
it('preserves checked uncertainty conclusions through SQLite backup and restore',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-uncertainty-answers-')),store=new WorkspaceStore(join(root,'source.sqlite'));
 try{const saved=store.saveLearning({id:'L46',answers:{selection:correct},check:true});await store.backup(join(root,'backup.sqlite'));const restored=new WorkspaceStore(join(root,'restored.sqlite'));try{populateBackup(restored,inspectBackup(join(root,'backup.sqlite')));expect(restored.learning('L46')).toEqual(saved);expect(saved.state).toBe('checked');}finally{restored.close();}}
 finally{store.close();if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-uncertainty-answers-'))throw new Error('Unexpected cleanup path');await rm(root,{recursive:true,force:true});}
});
