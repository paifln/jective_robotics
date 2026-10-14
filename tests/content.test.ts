import {sameSourceInputs} from '../packages/contracts/source-files';
import {describe,it,expect} from 'vitest';
import {lessons,artifacts} from '../packages/content/lessons';
import {worksheets} from '../packages/content/worksheets';
import {codeLessonArtifacts,codeLessonInvestigations} from '../packages/content/code-lessons';
import {ProjectSchema} from '../packages/contracts';
describe('authored learning material',()=>{
 it('has substantive learner text, translations, assessments and usable artifacts for each published lesson',()=>{
  const fields=['objectives','safety','explanation','workedExample','activity','challenge','observations','troubleshooting','evidence'] as const;
  expect(new Set(lessons.map(l=>l.id)).size).toBe(lessons.length);
  for(const lesson of lessons){
   expect(fields.map(key=>lesson[key].en).join(' ').match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length,lesson.id).toBeGreaterThanOrEqual(350);
   for(const key of fields)for(const locale of ['en','kk','ru'] as const)expect(lesson[key][locale].trim().length,lesson.id+' '+key+' '+locale).toBeGreaterThan(20);
   expect(lesson.questions.length,lesson.id).toBeGreaterThanOrEqual(3);
   expect(Boolean(artifacts[lesson.id]||codeLessonArtifacts[lesson.id]||codeLessonInvestigations[lesson.id]||worksheets[lesson.id as keyof typeof worksheets]),lesson.id).toBe(true);
   const investigation=codeLessonInvestigations[lesson.id];if(investigation){expect(investigation.length).toBeGreaterThan(0);expect(new Set(investigation.map(c=>c.id)).size).toBe(investigation.length);for(const entry of investigation){for(const input of [entry.starter,entry.corrected]){expect(ProjectSchema.safeParse({schemaVersion:1,id:'747b05f5-d281-45bb-9a3b-5e2fe2d08c7c',name:'Investigation artifact',mode:'code',workspace:{},revision:0,...input}).success).toBe(true);expect(input.source).toContain('void setup()');expect(input.source).toContain('void loop()');}expect(entry.starter.source!==entry.corrected.source||entry.starter.profileId!==entry.corrected.profileId).toBe(true);}}
   const code=codeLessonArtifacts[lesson.id];if(code){for(const source of [code.starter,code.reference]){expect(source).toContain('void setup()');expect(source).toContain('void loop()');}expect(sameSourceInputs({source:code.reference,sourceFiles:code.referenceFiles},{source:code.starter,sourceFiles:code.starterFiles})).toBe(false);expect(artifacts[lesson.id]).toBeUndefined();}
   for(const prerequisite of lesson.prerequisites)expect(lessons.some(l=>l.id===prerequisite),lesson.id+' prerequisite').toBe(true);
  }
 });
 it('requires separating observed and documented evidence in the power worksheet',()=>{
  expect(worksheets.L02.roles).toEqual(['controller','carrier','driver','actuator','sensor','supply']);
  for(const field of ['observed','documented','source','unknown','signalPath','powerPath','connectionDecision','reason'])expect(worksheets.L02.fields).toContain(field);
  expect(artifacts.L02).toBeUndefined();
 });
});
