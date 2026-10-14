import {it,expect} from 'vitest';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {functionsInterfaceArtifact,interfaceHelper,correctedInterfaceHelper,interfaceExercise,verifiedInterfaceCases} from '../packages/content/functions-interface';
import {gradeActivity} from '../packages/content/learning-activities';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
it('bundles the actual firmware and recorded native API outcomes without a physical claim',async()=>{
 expect(verifiedInterfaceCases.origin).toBe('real-runtime-host-fixture');expect(verifiedInterfaceCases.physicalVerification).toBe('NOT RUN');expect(verifiedInterfaceCases.cases).toHaveLength(8);
 for(const [file,hash]of Object.entries(verifiedInterfaceCases.sourceHashes))expect(createHash('sha256').update(await readFile('firmware/jective-runtime/'+file)).digest('hex')).toBe(hash);
 for(const row of verifiedInterfaceCases.cases){const expected=interfaceExercise.correct[row.id];if(expected)expect(expected).toBe(row.result);}
 expect(functionsInterfaceArtifact.starter).toContain(interfaceHelper);expect(functionsInterfaceArtifact.reference).toContain(correctedInterfaceHelper);expect(functionsInterfaceArtifact.reference).not.toContain('return true; // TODO');expect(functionsInterfaceArtifact.reference).toContain('Intentionally not initialized or armed');
 expect(functionsInterfaceArtifact.reference).not.toContain('robot.begin(');expect(functionsInterfaceArtifact.reference).not.toContain('robot.armAutonomous(');
});
it('checks each documented failure without granting code execution or physical completion',()=>{
 expect(gradeActivity(interfaceExercise,{})).toMatchObject({state:'incomplete',total:5});expect(gradeActivity(interfaceExercise,{...interfaceExercise.correct,'not-ready':'Accepted'})).toMatchObject({state:'needs-practice',correct:4});expect(gradeActivity(interfaceExercise,interfaceExercise.correct)).toMatchObject({state:'checked',correct:5});
});
it('retains L39 drafts and assessed answers through reopen and validated backup',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-l39-'));let store=new WorkspaceStore(join(root,'source.sqlite'));const restored=new WorkspaceStore(join(root,'restore.sqlite'));try{
  expect(store.learning('L39')).toBeNull();expect(store.saveLearning({id:'L39',answers:{valid:'InvalidInput'},check:false})).toMatchObject({state:'draft',attempts:0});expect(store.saveLearning({id:'L39',answers:{...interfaceExercise.correct,valid:'InvalidInput'},check:true})).toMatchObject({state:'needs-practice',attempts:1});const record=store.saveLearning({id:'L39',answers:interfaceExercise.correct,check:true});expect(record).toMatchObject({state:'checked',attempts:2});store.close();store=new WorkspaceStore(join(root,'source.sqlite'));expect(store.learning('L39')).toEqual(record);await store.backup(join(root,'backup.sqlite'));populateBackup(restored,inspectBackup(join(root,'backup.sqlite')));expect(restored.learning('L39')).toEqual(record);
  store.db.prepare('UPDATE settings SET value=? WHERE key=?').run('{"state":"checked"}','learning:L39');await store.backup(join(root,'malformed.sqlite'));expect(()=>inspectBackup(join(root,'malformed.sqlite'))).toThrow();
 }finally{store.close();restored.close();await rm(root,{recursive:true,force:true});}
});
