import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {responsibleAiLesson} from '../packages/content/lesson-responsible-ai';
import {responsibleAiExercise} from '../packages/content/responsible-ai-learning';
import {lessons} from '../packages/content/lessons';
import {gradeActivity} from '../packages/content/learning-activities';
import {WorkspaceStore,inspectBackup,populateBackup} from '../packages/persistence/workspace';
it('registers L54 substantive trilingual theory and keeps fixture provenance and independent evidence explicit',()=>{
 expect(lessons.find(l=>l.id==='L54')).toEqual(responsibleAiLesson);
 for(const locale of ['en','ru','kk'] as const){expect(responsibleAiLesson.explanation[locale].split('\n\n')).toHaveLength(6);expect(responsibleAiLesson.explanation[locale].length).toBeGreaterThan(1800);}
 expect(responsibleAiLesson.explanation.en).toContain('not answers from a live model');expect(responsibleAiLesson.evidence.en).toContain('actual compiler report');
});
it('checks evidence reasoning, distinguishing compiling regressions, stale snapshots and physical results',()=>{
 expect(gradeActivity(responsibleAiExercise,{deletion:'compile',build:'compile',changed:'repeat',record:'inspect'})).toMatchObject({state:'needs-practice',correct:3,total:4});
 expect(gradeActivity(responsibleAiExercise,{deletion:'reject',build:'compile',changed:'repeat',record:'inspect'}).state).toBe('checked');
 expect(gradeActivity(responsibleAiExercise,{}).state).toBe('incomplete');
});
it('retains actual L54 attempts through SQLite backup and restoration',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-ai-learning-')),source=new WorkspaceStore(join(root,'source.sqlite')),target=new WorkspaceStore(join(root,'target.sqlite'));
 try{source.saveLearning({id:'L54',answers:{deletion:'compile',build:'compile',changed:'repeat',record:'inspect'},check:true});const record=source.saveLearning({id:'L54',answers:{deletion:'reject',build:'compile',changed:'repeat',record:'inspect'},check:true});expect(record.attempts).toBe(2);await source.backup(join(root,'backup.sqlite'));populateBackup(target,inspectBackup(join(root,'backup.sqlite')));expect(target.learning('L54')).toEqual(record);}
 finally{source.close();target.close();await rm(root,{recursive:true,force:true});}
});
