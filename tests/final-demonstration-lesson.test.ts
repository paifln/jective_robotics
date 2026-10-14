import {it,expect} from 'vitest';
import {finalDemonstrationLesson as lesson} from '../packages/content/lesson-final-demonstration';
import {lessons} from '../packages/content/lessons';
import {studentTheory} from '../packages/content/student-theory';
import {studentTasks} from '../packages/content/student-tasks';
import {knowledgeChecks,gradeKnowledge} from '../packages/content/knowledge-check';
import {worksheets} from '../packages/content/worksheets';
it('registers the final demonstration with substantive localized explanation and reproducible worksheet',()=>{
 expect(lessons.find(l=>l.id==='L60')).toEqual(lesson);expect(lesson.prerequisites).toEqual(['L59']);expect(worksheets.L60.fields).toContain('project_revision');
 for(const locale of ['en','ru','kk'] as const){expect(lesson.explanation[locale].split('\n\n')).toHaveLength(6);expect(lesson.explanation[locale].length).toBeGreaterThan(2500);expect(studentTheory.L60!.explanation[locale]).toBe(lesson.explanation[locale]);expect(studentTasks.L60![locale]).toBe(lesson.activity[locale]);}
 expect(lesson.explanation.en).toContain('not a signature');expect(lesson.translationStatus).toBe('draft-review-required');
});
it('separates build evidence from hardware conclusions and checks the actual rubric maximum',()=>{
 expect(knowledgeChecks.L60!.number.answer).toBe(16);expect(gradeKnowledge('L60',0,'16').passed).toBe(true);expect(gradeKnowledge('L60',1,'16').passed).toBe(false);expect(gradeKnowledge('L60',0,'4').passed).toBe(false);
});
