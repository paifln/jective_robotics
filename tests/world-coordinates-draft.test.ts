import {it,expect} from 'vitest';
import {worldCoordinatesLesson} from '../packages/content/lesson-world-coordinates';
import {lessons} from '../packages/content/lessons';
import {LessonSchema} from '../packages/content';
it('authors substantive trilingual coordinate theory with real units and prerequisites and registers the course entry',()=>{
 const lesson=LessonSchema.parse(worldCoordinatesLesson);expect(lesson.id).toBe('L43');for(const prerequisite of lesson.prerequisites)expect(lessons.some(l=>l.id===prerequisite)).toBe(true);
 expect(lesson.explanation.en.trim().split(/\s+/).length).toBeGreaterThanOrEqual(350);for(const locale of ['en','ru','kk'] as const){expect(lesson.explanation[locale].length).toBeGreaterThan(2000);expect(lesson.questions).toHaveLength(3);expect(lesson.evidence[locale].length).toBeGreaterThan(100);}
 expect(lesson.explanation.en).toContain('y increases downwards');expect(lesson.explanation.en).toContain('90° is π/2');expect(lesson.explanation.en).toContain('not execution of your current program');expect(lesson.explanation.en).toContain('scheduled event times ms');expect(lesson.translationStatus).toBe('draft-review-required');expect(lessons.some(l=>l.id==='L43')).toBe(true);
});
