import {it,expect} from 'vitest';
import {ChallengeReportSchema} from '../packages/content/challenge-report';
import {evaluateChallenge,challengeTestPrograms,challengeTestWorld} from '../packages/content/challenge-test';
import type {Program} from '../packages/codegen';
const criteria={world:challengeTestWorld,timeoutMs:6000,requireGoal:true,forbidCollisions:true};
it('accepts actual goal/timeout/error traces and rejects inconsistent verdict evidence',()=>{
 const report=evaluateChallenge(challengeTestPrograms.passing,criteria);expect(ChallengeReportSchema.safeParse(report).success).toBe(true);expect(ChallengeReportSchema.safeParse(evaluateChallenge(challengeTestPrograms.failing,criteria)).success).toBe(true);
 const errorProgram:Program={setup:[{kind:'waitValue',value:{kind:'number',value:-1}}],loop:[]};expect(ChallengeReportSchema.safeParse(evaluateChallenge(errorProgram,criteria)).success).toBe(true);
 const changes=[(r:typeof report)=>{r.passed=false;},(r:typeof report)=>{r.reason='timeout';},(r:typeof report)=>{r.trace[0]!.pose.x=1;},(r:typeof report)=>{r.elapsedMs=6000;},(r:typeof report)=>{r.trace[1]!.timeMs=7;},(r:typeof report)=>{r.trace[1]!.goal=true;},(r:typeof report)=>{r.trace.pop();},(r:typeof report)=>{r.program.setup=[{kind:'drive',left:101,right:0}];}];
 for(const change of changes){const changed=structuredClone(report);change(changed);expect(ChallengeReportSchema.safeParse(changed).success).toBe(false);}
 const oversized=structuredClone(report);oversized.program.setup=[{kind:'print',text:'x'.repeat(100001)}];expect(ChallengeReportSchema.safeParse(oversized).success).toBe(false);
 const late=structuredClone(report);late.criteria.timeoutMs=20;expect(ChallengeReportSchema.safeParse(late).success).toBe(false);
 const initial=evaluateChallenge(challengeTestPrograms.passing,{...criteria,world:{...challengeTestWorld,goal:{...challengeTestWorld.goal,x:.5}}});expect(ChallengeReportSchema.safeParse(initial).success).toBe(true);
});
