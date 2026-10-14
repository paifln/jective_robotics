import {it,expect} from 'vitest';
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {profiles} from '../packages/profiles';
import {profileHash} from '../packages/profiles/registry';
import {verifyProjectProfile} from '../packages/profiles/binding';
import type {Project} from '../packages/contracts';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
import {writeProject,readProject} from '../packages/persistence';
const definition={...profiles[0]!,id:'custom-persistent',ledPin:4};const project:Project={schemaVersion:1,id:randomUUID(),name:'Persistent custom board',profileId:definition.id,profileDefinition:definition,profileVersion:definition.version,profileHash:profileHash(definition),mode:'code',source:'void setup(){} void loop(){}',workspace:{},revision:0};
it('custom definition survives SQLite reopening, snapshot restoration and validated backup transfer',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-custom-store-'));const path=join(root,'original.sqlite');let store=new WorkspaceStore(path);const target=new WorkspaceStore(join(root,'restored.sqlite'));try{store.autosave(project);store.snapshot(project,'Bound definition');store.close();store=new WorkspaceStore(path);expect(store.state().recovery).toEqual(project);const id=store.snapshots(project.id)[0]!.id;expect(store.restoreSnapshot(id)).toEqual(project);const backup=join(root,'backup.sqlite');await store.backup(backup);populateBackup(target,inspectBackup(backup));expect(target.state().recovery).toEqual(project);expect(verifyProjectProfile(target.project(project.id)!).hash).toBe(project.profileHash);const changed={...project,profileDefinition:{...definition,ledPin:5}};expect(()=>store.autosave(changed)).toThrow('PROFILE_MIGRATION_REQUIRED');expect(store.project(project.id)).toEqual(project);store.db.prepare('UPDATE projects SET json=? WHERE id=?').run(JSON.stringify(changed),project.id);expect(()=>store.project(project.id)).toThrow('PROFILE_MIGRATION_REQUIRED');await store.backup(backup);expect(()=>inspectBackup(backup)).toThrow('PROFILE_MIGRATION_REQUIRED');}finally{store.close();target.close();await rm(root,{recursive:true,force:true});}
});
it('project file rejects altered embedded definitions on read and write while preserving valid saved data',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-custom-file-'));const path=join(root,'project.json');try{const saved=await writeProject(path,project,null);expect(await readProject(path)).toEqual(saved);const before=await readFile(path,'utf8');const changed={...saved,profileDefinition:{...definition,ledPin:5}};await expect(writeProject(path,changed,saved.revision)).rejects.toThrow('PROFILE_MIGRATION_REQUIRED');expect(await readFile(path,'utf8')).toBe(before);await writeFile(path,JSON.stringify(changed));await expect(readProject(path)).rejects.toThrow('PROFILE_MIGRATION_REQUIRED');}finally{await rm(root,{recursive:true,force:true});}
});
