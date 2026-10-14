import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {gradeActivity} from '../packages/content/learning-activities';
import {collectionsExercise} from '../packages/content/collections-exercise';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
it('checks validation before storage and requires the complete correct ordering',()=>{
 expect(gradeActivity(collectionsExercise,{}).state).toBe('incomplete');expect(gradeActivity(collectionsExercise,{order:['parse','store','validate','emit']}).state).toBe('needs-practice');expect(gradeActivity(collectionsExercise,{order:['parse','validate','store','emit']}).state).toBe('checked');expect(gradeActivity(collectionsExercise,{order:['parse','parse','store','emit']}).state).toBe('needs-practice');
});
it('retains L41 ordering attempts through reopening and strictly validated backup',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-l41-'));let store=new WorkspaceStore(join(root,'source.sqlite'));const restored=new WorkspaceStore(join(root,'restore.sqlite'));
 try{expect(store.learning('L41')).toBeNull();store.saveLearning({id:'L41',answers:{order:['emit','store','validate','parse']},check:false});expect(store.saveLearning({id:'L41',answers:{order:['emit','store','validate','parse']},check:true})).toMatchObject({state:'needs-practice',attempts:1});const record=store.saveLearning({id:'L41',answers:{order:['parse','validate','store','emit']},check:true});expect(record).toMatchObject({state:'checked',attempts:2});store.close();store=new WorkspaceStore(join(root,'source.sqlite'));expect(store.learning('L41')).toEqual(record);await store.backup(join(root,'backup.sqlite'));populateBackup(restored,inspectBackup(join(root,'backup.sqlite')));expect(restored.learning('L41')).toEqual(record);store.db.prepare('UPDATE settings SET value=? WHERE key=?').run('{"state":"checked"}','learning:L41');await store.backup(join(root,'malformed.sqlite'));expect(()=>inspectBackup(join(root,'malformed.sqlite'))).toThrow();}
 finally{store.close();restored.close();await rm(root,{recursive:true,force:true});}
});
