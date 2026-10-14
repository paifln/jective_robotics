import {it,expect} from 'vitest';
import {evaluateChallenge,challengeTestWorld,challengeTestPrograms,ChallengeTestSchema} from '../packages/content/challenge-test';
import type {Program} from '../packages/codegen';
const criteria={world:challengeTestWorld,timeoutMs:6000,requireGoal:true,forbidCollisions:true};
it('evaluates passing and failing programs under exactly the same scenario and keeps actual evidence',()=>{
 const pass=evaluateChallenge(challengeTestPrograms.passing,criteria),fail=evaluateChallenge(challengeTestPrograms.failing,criteria);
 expect(pass.passed).toBe(true);expect(pass.reason).toBe('goal-reached');expect(fail.passed).toBe(false);expect(fail.reason).toBe('timeout');expect(fail.elapsedMs).toBe(6000);expect(pass.criteria).toEqual(fail.criteria);expect(pass.trace.at(-1)!.goal).toBe(true);expect(pass.physicalVerification).toBe('NOT RUN');expect(pass).toEqual(evaluateChallenge(challengeTestPrograms.passing,criteria));
 expect(ChallengeTestSchema.safeParse({...criteria,timeoutMs:21}).success).toBe(false);expect(ChallengeTestSchema.safeParse({...criteria,timeoutMs:100000}).success).toBe(false);
});
it('rejects collisions and early completion and supports an explicitly goal-free duration criterion',()=>{
 const world={...challengeTestWorld,goal:{x:2.5,y:1,radius:.1},obstacles:[{x:1.2,y:0,width:.2,height:2}]};const collided=evaluateChallenge(challengeTestPrograms.passing,{...criteria,world});expect(collided.passed).toBe(false);expect(collided.reason).toBe('collision');expect(collided.trace.at(-1)!.collision).toBe(true);
 const done:Program={setup:[{kind:'stop'}],loop:[]};expect(evaluateChallenge(done,criteria).reason).toBe('completed-without-goal');expect(evaluateChallenge(done,{...criteria,requireGoal:false}).passed).toBe(true);expect(evaluateChallenge(challengeTestPrograms.failing,{...criteria,requireGoal:false}).reason).toBe('duration-passed');
 expect(evaluateChallenge(challengeTestPrograms.passing,{...criteria,world,forbidCollisions:false}).reason).toBe('completed-without-goal');
 const badWait:Program={setup:[{kind:'waitValue',value:{kind:'number',value:-1}}],loop:[]};expect(evaluateChallenge(badWait,criteria).reason).toBe('program-error');
 const atGoal={...challengeTestWorld,goal:{...challengeTestWorld.goal,x:challengeTestWorld.start.x,y:challengeTestWorld.start.y}};expect(evaluateChallenge(done,{...criteria,world:atGoal}).elapsedMs).toBe(0);
});
it('includes the deadline goal step, fails one step earlier and keeps input snapshots independent',()=>{
 const baseline=evaluateChallenge(challengeTestPrograms.passing,criteria),deadline=baseline.elapsedMs;
 expect(deadline).toBeGreaterThan(20);expect(deadline%20).toBe(0);
 const exact=evaluateChallenge(challengeTestPrograms.passing,{...criteria,timeoutMs:deadline}),early=evaluateChallenge(challengeTestPrograms.passing,{...criteria,timeoutMs:deadline-20});
 expect(exact.reason).toBe('goal-reached');expect(exact.passed).toBe(true);expect(early.reason).toBe('timeout');expect(early.passed).toBe(false);expect(early.trace.at(-1)!.goal).toBe(false);
 expect(exact.trace.every((state,i)=>state.timeMs===i*20)).toBe(true);expect(exact.trace.length).toBe(deadline/20+1);
 const ownCriteria=structuredClone(criteria),ownProgram=structuredClone(challengeTestPrograms.passing),saved=evaluateChallenge(ownProgram,ownCriteria);ownCriteria.world.start.x=1;ownProgram.setup=[];expect(saved.criteria.world.start.x).toBe(.5);expect(saved.program.setup).not.toHaveLength(0);
 expect(()=>evaluateChallenge(challengeTestPrograms.passing,{...criteria,world:{...challengeTestWorld,start:{x:0,y:1,heading:0}}})).toThrow();
});
