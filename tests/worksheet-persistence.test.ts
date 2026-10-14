import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {ProjectSchema} from '../packages/contracts';
import {encodeArchive,decodeArchive} from '../packages/persistence/archives';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
it('validated worksheet answers survive portable archives, autosave and reconstructed workspace backups',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-worksheet-store-'));const store=new WorkspaceStore(join(root,'source.sqlite'));const restored=new WorkspaceStore(join(root,'restored.sqlite'));
 const project=ProjectSchema.parse({schemaVersion:1,id:randomUUID(),name:'Worksheet evidence',profileId:'esp32-devkit-reference',mode:'blocks',source:'',workspace:{},revision:0,worksheets:{'L02-component-role-and-power-path':{'controller.marking':'Белгі неизвестна','controller.unknown':'Need exact revision'}}});
 try{
  expect(decodeArchive(encodeArchive('project',project)).value).toEqual(project);
  store.autosave(project);expect(store.state().recovery?.worksheets).toEqual(project.worksheets);
  await store.backup(join(root,'backup.sqlite'));populateBackup(restored,inspectBackup(join(root,'backup.sqlite')));expect(restored.state().recovery?.worksheets).toEqual(project.worksheets);
  for(const answers of [{'unknown.field':'value'},{'controller.marking':'x'.repeat(2001)}])expect(ProjectSchema.safeParse({...project,worksheets:{'L02-component-role-and-power-path':answers}}).success).toBe(false);
 }finally{store.close();restored.close();await rm(root,{recursive:true,force:true});}
});
