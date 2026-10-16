import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {demonstrationFields,verificationKinds,rubricCriteria,emptyDemonstration,demonstrationFromAnswers,reviewDemonstration,createDemonstrationPackage,verifyDemonstrationPackage} from '../packages/content/final-demonstration';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
import {parseLearningRecord} from '../packages/content/learning-records';
import type {Project} from '../packages/contracts';
const project:Project={schemaVersion:1,id:'108d72ef-d3c8-4e14-b196-bb4da00c0cac',name:'Saved demonstration',profileId:'esp32-devkit-reference',mode:'code',source:'void setup(){}\nvoid loop(){}',sourceFiles:{'helper.h':'#pragma once\n'},workspace:{},revision:2};
const complete=()=>{const d=emptyDemonstration();for(const k of demonstrationFields)d[k]='Learner-authored explanation requiring human review: '+k;for(const k of verificationKinds)d[`${k}_detail`]='Not run: equipment or independent verification unavailable.';for(const k of rubricCriteria)d[`rubric_${k}`]='2';d.rubric_feedback='Self assessment pending another human review.';d.project_id=project.id;d.project_revision='2';return d;};
it('keeps four verification categories independent and permits honest not-run demonstrations',()=>{
 const d=complete();expect(reviewDemonstration(emptyDemonstration()).state).toBe('incomplete');expect(reviewDemonstration(d)).toMatchObject({state:'self-reported',score:8,maximum:16,reviewerIdentity:'not-authenticated'});
 d.compilation_status='reported';d.compilation_detail='Learner reports a build; original CLI report stored separately.';const r=reviewDemonstration(d);expect(r.verification.compilation!.status).toBe('reported');expect(r.verification.upload!.status).toBe('not-run');expect(r.verification.physical!.status).toBe('not-run');
 expect(()=>demonstrationFromAnswers({...d,physical_status:'verified'})).toThrow();expect(()=>demonstrationFromAnswers({...d,rubric_mission:'5'})).toThrow();expect(()=>demonstrationFromAnswers({...d,automaticApproval:'yes'})).toThrow();
});
it('binds the actual saved multifile project and resolved profile to a bounded content digest',async()=>{
 const d=complete(),p=await createDemonstrationPackage(d,project);expect((await verifyDemonstrationPackage(JSON.parse(JSON.stringify(p)))).payload.project).toEqual(project);expect(p.payload.profile.id).toBe(project.profileId);expect(p.payload.report.automaticVerification.physical).toBe('NOT RUN by this form');
 const changed=structuredClone(p);changed.payload.project.sourceFiles!['helper.h']+='// altered';await expect(verifyDemonstrationPackage(changed)).rejects.toThrow('DEMONSTRATION_PACKAGE_TAMPERED');
 const fake={...p,payload:{...p.payload,report:{...p.payload.report,review:{...p.payload.report.review,score:16}}}};await expect(verifyDemonstrationPackage(fake)).rejects.toThrow('DEMONSTRATION_PACKAGE_TAMPERED');
 await expect(createDemonstrationPackage(d,{...project,revision:3})).rejects.toThrow('DEMONSTRATION_PROJECT_MISMATCH');
 await expect(createDemonstrationPackage(d,{...project,workspace:{huge:'x'.repeat(2*1024*1024)}})).rejects.toThrow('DEMONSTRATION_PACKAGE_LIMIT');
 await expect(createDemonstrationPackage(d,{...project,workspace:{unsupported:()=>1}})).rejects.toThrow('PROJECT_WORKSPACE_UNSAFE');
 const nested:Record<string,unknown>={};let leaf=nested;for(let i=0;i<40;i++){const next={};leaf.child=next;leaf=next;}await expect(createDemonstrationPackage(d,{...project,workspace:nested})).rejects.toThrow('DEMONSTRATION_PACKAGE_LIMIT');
 const nullable=await createDemonstrationPackage(d,{...project,workspace:{flags:[true,false,null]},wiring:{led:null}});expect((await verifyDemonstrationPackage(nullable)).payload.project.wiring!.led).toBeNull();
 await expect(createDemonstrationPackage(d,{...project,workspace:{many:Array.from({length:100001},()=>0)}})).rejects.toThrow('PROJECT_WORKSPACE_UNSAFE');
 await expect(createDemonstrationPackage(d,{...project,workspace:{unicode:'\u0410'.repeat(1100000)}})).rejects.toThrow('DEMONSTRATION_PACKAGE_LIMIT');
 await expect(createDemonstrationPackage(d,{...project,workspace:{[('key').repeat(800000)]:0}})).rejects.toThrow('DEMONSTRATION_PACKAGE_LIMIT');
 await expect(createDemonstrationPackage(d,{...project,workspace:{nonfinite:NaN}})).rejects.toThrow('PROJECT_WORKSPACE_UNSAFE');
});
it('persists reported rubric and verification categories through native SQLite backup without accepting checked status',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-demonstration-')),source=new WorkspaceStore(join(root,'source.sqlite')),target=new WorkspaceStore(join(root,'target.sqlite'));
 try{const d=complete(),saved=source.saveLearning({id:'L60',answers:d,check:true});expect(saved).toMatchObject({state:'self-reported',attempts:1});expect(()=>parseLearningRecord('L60',{...saved,state:'checked'})).toThrow('LEARNING_RECORD_STATE_INVALID');await source.backup(join(root,'backup.sqlite'));populateBackup(target,inspectBackup(join(root,'backup.sqlite')));expect(target.learning('L60')).toEqual(saved);
 }finally{source.close();target.close();await rm(root,{recursive:true,force:true});}
});
