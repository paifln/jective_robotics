import {test,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {ProjectSchema} from '../packages/contracts';
import {resolveProfile} from '../packages/profiles';
import {assessRoverInspection} from '../packages/content/rover-inspection';
import {encodeArchive,decodeArchive} from '../packages/persistence/archives';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
test('rover inspection preserves incomplete and physical evidence through archives, autosave and backup restoration',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-rover-report-'));const store=new WorkspaceStore(join(root,'source.sqlite'));const restored=new WorkspaceStore(join(root,'restored.sqlite'));
 const report={schemaVersion:1,guideId:'G04',assemblyRevision:'Ровер A / оқу',board:resolveProfile('esp32-devkit-reference'),componentId:'motor-direction-enable',wiring:{leftDirection:18,leftEnable:19,rightDirection:21,rightEnable:22},checks:{polarity:{status:'fail',note:'Проверить разъём'}},teacherObservation:{observer:'Учитель',observedAt:'2026-10-10T12:00:00+05:00',note:'Осмотр без питания'}};
 const project=ProjectSchema.parse({schemaVersion:1,id:randomUUID(),name:'Rover inspection',profileId:'esp32-devkit-reference',mode:'blocks',source:'',workspace:{},revision:0,worksheets:{'L19-rover-inspection':report}});
 try{
  expect(decodeArchive(encodeArchive('project',project)).value).toEqual(project);
  store.autosave(project);expect(store.state().recovery?.worksheets).toEqual(project.worksheets);
  await store.backup(join(root,'backup.sqlite'));populateBackup(restored,inspectBackup(join(root,'backup.sqlite')));expect(restored.state().recovery?.worksheets).toEqual(project.worksheets);
  expect(assessRoverInspection(restored.state().recovery!.worksheets!['L19-rover-inspection']).physicalEvidenceRecorded).toBe(false);
  expect(ProjectSchema.safeParse({...project,worksheets:{'L19-rover-inspection':{...report,checks:{typo:{status:'pass',note:'Invalid key'}}}}}).success).toBe(false);
 }finally{store.close();restored.close();await rm(root,{recursive:true,force:true});}
});
