import {it,expect} from 'vitest';
import {challengeTestLesson} from '../packages/content/lesson-challenge-test';
import {processChallengeRequest} from '../packages/content/challenge-worker';
it('grounds trilingual test theory in actual same-scenario outcomes and changed criteria',()=>{
 expect(challengeTestLesson.id).toBe('L47');expect(challengeTestLesson.translationStatus).toBe('draft-review-required');
 for(const locale of ['en','ru','kk'] as const){expect(challengeTestLesson.explanation[locale].split('\n\n')).toHaveLength(6);expect(challengeTestLesson.explanation[locale].length).toBeGreaterThan(2000);expect(challengeTestLesson.questions.every(q=>q.question[locale].length>10&&q.answer[locale].length>10)).toBe(true);}
 const run=(timeoutMs:number,requireGoal=true)=>{const reply=processChallengeRequest({operationId:crypto.randomUUID(),inputs:{timeoutMs,requireGoal,forbidCollisions:true}});if(!reply.ok)throw new Error(reply.error);return reply.reports;};
 const normal=run(6000),short=run(20),goalFree=run(20,false);expect(normal.moving.passed).toBe(true);expect(normal.stationary.reason).toBe('timeout');expect(short.moving.passed).toBe(false);expect(short.stationary.passed).toBe(false);expect(goalFree.stationary.passed).toBe(true);expect(normal.moving.criteria.world.obstacles).toHaveLength(0);expect(normal.moving.physicalVerification).toBe('NOT RUN');
});
