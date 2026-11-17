import {it,expect} from 'vitest';
import {repeatableLesson} from '../packages/content/lesson-repeatable';
import {lessons} from '../packages/content/lessons';
import {LessonSchema} from '../packages/content';
it('authors substantive trilingual experimental theory with valid prerequisites and honest model limits',()=>{const lesson=LessonSchema.parse(repeatableLesson);expect(lesson.id).toBe('L44');expect(lesson.explanation.en.split(/\s+/).length).toBeGreaterThan(350);for(const locale of ['en','ru','kk'] as const)expect(lesson.explanation[locale].length).toBeGreaterThan(2000);for(const id of lesson.prerequisites)expect(lessons.some(l=>l.id===id)).toBe(true);expect(lesson.explanation.en).toContain('fixed 0.02 s steps');expect(lesson.explanation.en).toContain('If noise is zero');expect(lesson.explanation.en).toContain('not proof that either algorithm is better');expect(lesson.translationStatus).toBe('draft-review-required');expect(lessons.some(l=>l.id==='L44')).toBe(true);});
