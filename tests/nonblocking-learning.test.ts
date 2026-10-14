import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {gradeActivity} from '../packages/content/learning-activities';
import {nonblockingExercise} from '../packages/content/nonblocking-exercise';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
it('assesses polling delay and rejects interpreting the clock value as latency',()=>{
 expect(gradeActivity(nonblockingExercise,{}).state).toBe('incomplete');
 expect(gradeActivity(nonblockingExercise,{number:'360'}).state).toBe('needs-practice');
 expect(gradeActivity(nonblockingExercise,{number:'7'}).state).toBe('checked');
 expect(gradeActivity(nonblockingExercise,{number:'NaN'}).state).toBe('needs-practice');
});
it('preserves L40 attempts through reopen and strict backup without accepting malformed records',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-l40-'));let store=new WorkspaceStore(join(root,'source.sqlite'));const restored=new WorkspaceStore(join(root,'restore.sqlite'));
 try{expect(store.learning('L40')).toBeNull();store.saveLearning({id:'L40',answers:{number:'360'},check:false});expect(store.saveLearning({id:'L40',answers:{number:'360'},check:true})).toMatchObject({state:'needs-practice',attempts:1});const record=store.saveLearning({id:'L40',answers:{number:'7'},check:true});expect(record).toMatchObject({state:'checked',attempts:2});store.close();store=new WorkspaceStore(join(root,'source.sqlite'));expect(store.learning('L40')).toEqual(record);await store.backup(join(root,'backup.sqlite'));populateBackup(restored,inspectBackup(join(root,'backup.sqlite')));expect(restored.learning('L40')).toEqual(record);store.db.prepare('UPDATE settings SET value=? WHERE key=?').run('{"state":"checked"}','learning:L40');await store.backup(join(root,'malformed.sqlite'));expect(()=>inspectBackup(join(root,'malformed.sqlite'))).toThrow();}
 finally{store.close();restored.close();await rm(root,{recursive:true,force:true});}
});
