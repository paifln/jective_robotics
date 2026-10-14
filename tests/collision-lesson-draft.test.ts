import {it,expect} from 'vitest';
import {collisionLesson} from '../packages/content/lesson-collision';
import {runCollisionCases} from '../packages/content/collision-cases';
it('provides trilingual failure explanations grounded in the actual scenario suite',()=>{
 expect(collisionLesson.id).toBe('L45');expect(collisionLesson.translationStatus).toBe('draft-review-required');
 for(const locale of ['en','ru','kk'] as const){expect(collisionLesson.explanation[locale].split('\n\n')).toHaveLength(6);expect(collisionLesson.explanation[locale].length).toBeGreaterThan(2000);expect(collisionLesson.questions.every(q=>q.question[locale].length>10&&q.answer[locale].length>10)).toBe(true);}
 const report=runCollisionCases();expect(report.invalidStart.rejected).toBe(true);expect(report.cases.narrow!.starter.collisionSeen).toBe(true);expect(report.cases.range!.corrected.final.pose).toEqual(report.cases.range!.world.start);
 expect(report.cases.wall!.starter.trace.at(-1)!.timeMs).toBeLessThan(6000);expect(report.cases.wall!.corrected.trace.at(-1)!.timeMs).toBe(6000);
});
