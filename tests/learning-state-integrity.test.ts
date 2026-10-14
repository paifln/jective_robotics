import {it,expect} from 'vitest';
import {nextLearningRecord,parseLearningRecord} from '../packages/content/learning-records';
import {WorkspaceStore,inspectBackup} from '../packages/persistence/workspace';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
it('rechecks simple activity grades but permits saved ungraded drafts',()=>{
 const record=nextLearningRecord({id:'F01',answers:{},check:true},null);
 expect(record.state).toBe('incomplete');expect(parseLearningRecord('F01',record)).toEqual(record);
 expect(()=>parseLearningRecord('F01',{...record,state:'checked'})).toThrow('LEARNING_RECORD_STATE_INVALID');
 expect(parseLearningRecord('F01',{...record,state:'draft'}).state).toBe('draft');
});
it('rejects forged simple-activity grades in backup inspection without changing current work',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-learning-state-'));const store=new WorkspaceStore(join(root,'workspace.sqlite'));
 try{
  const record=store.saveLearning({id:'F01',answers:{},check:true});const path=join(root,'backup.sqlite');await store.backup(path);
  const backup=new DatabaseSync(path);try{backup.prepare('UPDATE settings SET value=? WHERE key=?').run(JSON.stringify({...record,state:'checked'}),'learning:F01');}finally{backup.close();}
  expect(()=>inspectBackup(path)).toThrow('LEARNING_RECORD_STATE_INVALID');expect(store.learning('F01')).toEqual(record);
 }finally{store.close();await rm(root,{recursive:true,force:true});}
});
