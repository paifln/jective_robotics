import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {typesScopeExercise} from '../packages/content/types-scope';
import {gradeActivity} from '../packages/content/learning-activities';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
it('L38 retains assessed predictions through reopen and strictly validated backup',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-l38-'));let store=new WorkspaceStore(join(root,'source.sqlite'));const restored=new WorkspaceStore(join(root,'restore.sqlite'));try{
  expect(gradeActivity(typesScopeExercise,{})).toMatchObject({state:'incomplete',total:6});expect(store.learning('L38')).toBeNull();expect(store.saveLearning({id:'L38',answers:{integer:'1.5'},check:false})).toMatchObject({state:'draft',attempts:0});
  expect(store.saveLearning({id:'L38',answers:{...typesScopeExercise.correct,integer:'1.5'},check:true})).toMatchObject({state:'needs-practice',attempts:1});const checked=store.saveLearning({id:'L38',answers:typesScopeExercise.correct,check:true});expect(checked).toMatchObject({state:'checked',attempts:2});
  store.close();store=new WorkspaceStore(join(root,'source.sqlite'));expect(store.learning('L38')).toEqual(checked);await store.backup(join(root,'backup.sqlite'));populateBackup(restored,inspectBackup(join(root,'backup.sqlite')));expect(restored.learning('L38')).toEqual(checked);
  store.db.prepare('UPDATE settings SET value=? WHERE key=?').run('{"state":"checked"}','learning:L38');await store.backup(join(root,'malformed.sqlite'));expect(()=>inspectBackup(join(root,'malformed.sqlite'))).toThrow();
 }finally{store.close();restored.close();await rm(root,{recursive:true,force:true});}
});
