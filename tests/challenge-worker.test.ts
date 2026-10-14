import {it,expect} from 'vitest';
import {processChallengeRequest} from '../packages/content/challenge-worker';
import {ChallengeReportSchema} from '../packages/content/challenge-report';
it('evaluates both lesson programs under identical declared criteria and validates actual reports',()=>{
 const operationId=crypto.randomUUID(),inputs={timeoutMs:6000,requireGoal:true,forbidCollisions:true},result=processChallengeRequest({operationId,inputs});expect(result.operationId).toBe(operationId);expect(result.ok).toBe(true);
 if(result.ok){expect(ChallengeReportSchema.safeParse(result.reports.moving).success).toBe(true);expect(ChallengeReportSchema.safeParse(result.reports.stationary).success).toBe(true);expect(result.reports.moving.passed).toBe(true);expect(result.reports.stationary.passed).toBe(false);expect(result.reports.moving.criteria).toEqual(result.reports.stationary.criteria);}
 const short=processChallengeRequest({operationId,inputs:{...inputs,timeoutMs:20}});if(!short.ok)throw new Error('Expected valid request');expect(short.reports.moving.passed).toBe(false);
});
it('rejects expanded or unbounded requests without accepting unvalidated operation identities',()=>{
 const operationId=crypto.randomUUID(),inputs={timeoutMs:6000,requireGoal:true,forbidCollisions:true};
 for(const value of [null,{}, {operationId:'invalid',inputs},{operationId,inputs:{...inputs,timeoutMs:100000}},{operationId,inputs:{...inputs,world:{}}},{operationId,inputs,source:'arbitrary code'}]){const result=processChallengeRequest(value);expect(result.ok).toBe(false);if(!result.ok)expect(result.error.length).toBeLessThanOrEqual(2000);}
 expect(processChallengeRequest({operationId,inputs,extra:true}).operationId).toBe(operationId);expect(processChallengeRequest(null).operationId).toBe('');
});
