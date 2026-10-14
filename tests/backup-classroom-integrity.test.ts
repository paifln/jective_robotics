import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {WorkspaceStore,inspectBackup} from '../packages/persistence/workspace';
it('backup inspection rejects classroom metadata mismatches and orphaned recovery pointers',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-backup-integrity-'));const store=new WorkspaceStore(join(root,'workspace.sqlite'));
 const project={schemaVersion:1 as const,id:randomUUID(),name:'Evidence',profileId:'esp32-devkit-reference' as const,mode:'code' as const,source:'',workspace:{},revision:0};
 const assignment={schemaVersion:1 as const,id:randomUUID(),classId:randomUUID(),title:'Assignment',lessonIds:['L06'],dueDate:'',instructions:'Record observations',permittedProfiles:['esp32-devkit-reference' as const],rubric:[{id:'evidence',title:'Evidence',maxScore:10}]};
 const submission={schemaVersion:1 as const,id:randomUUID(),assignmentId:assignment.id,learnerId:'learner-one',version:1,project,evidence:[],submittedAt:'2026-10-10'};
 try{
  store.assignment(assignment);store.submission(submission);store.grade({submissionId:submission.id,scores:{evidence:8},feedback:'Reviewed'});store.autosave(project);
  const check=async(code:string)=>{const path=join(root,'check.sqlite');await store.backup(path);expect(()=>inspectBackup(path)).toThrow(code);};
  store.db.prepare('UPDATE assignments SET id=?').run(randomUUID());await check('BACKUP_ASSIGNMENT_METADATA_MISMATCH');store.db.prepare('UPDATE assignments SET id=?').run(assignment.id);
  store.db.prepare('UPDATE submissions SET version=2').run();await check('BACKUP_SUBMISSION_METADATA_MISMATCH');store.db.prepare('UPDATE submissions SET version=1').run();
  store.db.prepare('UPDATE grades SET submission_id=?').run(randomUUID());await check('BACKUP_GRADE_METADATA_MISMATCH');store.db.prepare('UPDATE grades SET submission_id=?').run(submission.id);
  store.db.prepare("UPDATE settings SET value=? WHERE key='recovery'").run(randomUUID());await check('BACKUP_RECOVERY_ORPHAN');
  store.db.prepare("UPDATE settings SET value=? WHERE key='recovery'").run(project.id);
  store.db.prepare('DELETE FROM assignments').run();await check('BACKUP_SUBMISSION_ORPHAN');store.assignment(assignment);
  store.db.prepare('DELETE FROM submissions').run();await check('BACKUP_GRADE_ORPHAN');
 }finally{store.close();await rm(root,{recursive:true,force:true});}
});
