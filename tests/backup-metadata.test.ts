import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
it('backup reconstruction preserves exact project dates and named snapshot identities, labels, dates and content',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-backup-metadata-'));const source=new WorkspaceStore(join(root,'source.sqlite'));const restored=new WorkspaceStore(join(root,'restored.sqlite'));
 const project={schemaVersion:1 as const,id:randomUUID(),name:'Recorded experiment',profileId:'esp32-devkit-reference' as const,mode:'code' as const,source:'void setup(){}\nvoid loop(){}',workspace:{},revision:3};
 try{
  source.autosave(project);source.snapshot(project,'Before calibration');source.snapshot({...project,revision:4},'After calibration');
  source.db.prepare('UPDATE projects SET saved_at=?').run('2025-01-01T12:30:00.000Z');source.db.prepare('UPDATE snapshots SET created_at=?').run('2025-01-01T12:31:00.000Z');
  await source.backup(join(root,'backup.sqlite'));populateBackup(restored,inspectBackup(join(root,'backup.sqlite')));
  expect(restored.state().recent).toEqual(source.state().recent);expect(restored.snapshots(project.id)).toEqual(source.snapshots(project.id));
  for(const snapshot of source.snapshots(project.id))expect(restored.restoreSnapshot(snapshot.id)).toEqual(source.restoreSnapshot(snapshot.id));
  restored.snapshot(project,'New snapshot after restore');expect(restored.snapshots(project.id)[0]!.id).toBeGreaterThan(2);
  source.db.prepare('UPDATE snapshots SET project_id=? WHERE id=1').run(randomUUID());await source.backup(join(root,'bad.sqlite'));expect(()=>inspectBackup(join(root,'bad.sqlite'))).toThrow('BACKUP_SNAPSHOT_METADATA_MISMATCH');
 }finally{source.close();restored.close();await rm(root,{recursive:true,force:true});}
});
