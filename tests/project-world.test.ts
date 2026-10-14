import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {join,resolve,basename,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {ProjectSchema,type Project} from '../packages/contracts';
import {WorldSchema} from '../packages/simulator/world-schema';
import {createLessonWorld} from '../packages/simulator/world-design';
import {createProjectCopy} from '../packages/contracts/project-copy';
import {encodeArchive,decodeArchive} from '../packages/persistence/archives';
import {writeProject,readProject} from '../packages/persistence';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
const base=():Project=>({schemaVersion:1,id:randomUUID(),name:'World project',profileId:'esp32-devkit-reference',mode:'blocks',source:'void setup(){} void loop(){}',workspace:{},revision:0});
const area=()=>WorldSchema.parse({...createLessonWorld({width:6,height:4,start:{x:1,y:1,headingDegrees:90},goal:{x:5,y:3,radius:.25},obstacles:[]}),line:[{x:1,y:1},{x:2,y:2}],inputs:{button:true},buttonEvents:[{timeMs:200,pressed:false}],robot:{seed:78},analog:{referenceVolts:3.3,bits:12,inputVolts:1.5},distanceInput:{initialMeters:.5,events:[{timeMs:400,meters:null}]}});
it('keeps old projects valid and rejects invalid owned world geometry at the project boundary',()=>{
 expect(ProjectSchema.parse(base()).simulationWorld).toBeUndefined();const world=area();expect(ProjectSchema.parse({...base(),simulationWorld:world}).simulationWorld).toEqual(world);
 for(const changed of [{...world,start:{x:0,y:0,heading:0}},{...world,buttonEvents:[{timeMs:500,pressed:true},{timeMs:200,pressed:false}]},{...world,extra:'bad'}])expect(()=>ProjectSchema.parse({...base(),simulationWorld:changed})).toThrow();
});
it('retains worlds in portable projects and deeply independent copies',()=>{
 const p={...base(),simulationWorld:area()},decoded=decodeArchive(encodeArchive('project',p));expect(decoded.kind).toBe('project');expect(decoded.value).toEqual(p);const copy=createProjectCopy(p,randomUUID());expect(copy.simulationWorld).toEqual(p.simulationWorld);copy.simulationWorld!.line[0]!.x=3;expect(p.simulationWorld.line[0]!.x).toBe(1);
});
it('preserves owned worlds across disk save/open, recovery, snapshots and SQLite backup/restore',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-project-world-')),store=new WorkspaceStore(join(root,'source.sqlite'));try{const p={...base(),simulationWorld:area()},saved=await writeProject(join(root,'project.json'),p,null);expect((await readProject(join(root,'project.json'))).simulationWorld).toEqual(p.simulationWorld);store.completedSave(saved);store.autosave({...saved,name:'Edited'});expect(store.state().recovery!.simulationWorld).toEqual(p.simulationWorld);expect(store.restoreSnapshot(store.snapshots(p.id)[0]!.id)!.simulationWorld).toEqual(p.simulationWorld);await store.backup(join(root,'backup.sqlite'));const backup=inspectBackup(join(root,'backup.sqlite')),restored=new WorkspaceStore(join(root,'restored.sqlite'));try{populateBackup(restored,backup);expect(restored.project(p.id)!.simulationWorld).toEqual(p.simulationWorld);expect(restored.state().recovery!.simulationWorld).toEqual(p.simulationWorld);}finally{restored.close();}}finally{store.close();if(!resolve(root).startsWith(resolve(tmpdir())+sep)||!basename(root).startsWith('jective-project-world-'))throw new Error('Unexpected cleanup path');await rm(root,{recursive:true,force:true});}
});
