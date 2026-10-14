import {it,expect} from 'vitest';
import {documentationLesson} from '../packages/content/lesson-documentation';
import {lessons} from '../packages/content/lessons';
import {studentTheory} from '../packages/content/student-theory';
import {studentTasks} from '../packages/content/student-tasks';
import {knowledgeChecks,gradeKnowledge} from '../packages/content/knowledge-check';
import {worksheets} from '../packages/content/worksheets';
it('registers substantive trilingual documentation with a real worksheet and honest peer evidence',()=>{
 expect(lessons.find(l=>l.id==='L59')).toEqual(documentationLesson);expect(worksheets.L59.fields).toHaveLength(10);
 for(const locale of ['en','ru','kk'] as const){expect(documentationLesson.explanation[locale].split('\n\n')).toHaveLength(6);expect(documentationLesson.explanation[locale].length).toBeGreaterThan(2500);expect(studentTheory.L59!.explanation[locale]).toBe(documentationLesson.explanation[locale]);expect(studentTasks.L59![locale]).toBe(documentationLesson.activity[locale]);}
 expect(documentationLesson.translationStatus).toBe('draft-review-required');expect(documentationLesson.explanation.en).toContain('Do not fill invented success');
});
it('checks a pending peer attempt and retention of both instruction versions',()=>{
 const bank=knowledgeChecks.L59!;expect(bank.number.answer).toBe(12);expect(gradeKnowledge('L59',0,'12').passed).toBe(true);expect(gradeKnowledge('L59',1,'12').passed).toBe(false);expect(gradeKnowledge('L59',0,'6').passed).toBe(false);
});
