import {z} from 'zod';
import type {Program} from '../codegen';
import {RobotSimulation,WorldSchema,type RobotState} from '../simulator';
export const ChallengeTestSchema=z.object({world:WorldSchema,timeoutMs:z.number().int().min(20).max(6000).refine(n=>n%20===0,'FIXED_STEP_REQUIRED'),requireGoal:z.boolean(),forbidCollisions:z.boolean()}).strict();
export type ChallengeVerdict='goal-reached'|'collision'|'program-error'|'completed-without-goal'|'timeout'|'duration-passed'|'completed';
/** Collision/error take precedence over goal; a goal exactly at the deadline counts. */
export function challengeDecision(state:RobotState,criteria:z.infer<typeof ChallengeTestSchema>):{passed:boolean;reason:ChallengeVerdict}|null{
 if(state.status==='error')return {passed:false,reason:'program-error'};
 if(criteria.forbidCollisions&&state.collision)return {passed:false,reason:'collision'};
 if(criteria.requireGoal&&state.goal)return {passed:true,reason:'goal-reached'};
 if(state.status==='completed')return {passed:!criteria.requireGoal,reason:criteria.requireGoal?'completed-without-goal':'completed'};
 if(state.timeMs>=criteria.timeoutMs)return {passed:!criteria.requireGoal,reason:criteria.requireGoal?'timeout':'duration-passed'};
 return null;
}
/** Evaluates supported block IR against one explicit scenario; arbitrary C++ is not executed. */
export function evaluateChallenge(program:Program,value:unknown){
 const criteria=ChallengeTestSchema.parse(value),simulation=new RobotSimulation(structuredClone(program),structuredClone(criteria.world));
 const trace:RobotState[]=[structuredClone(simulation.state)];
 const result=(passed:boolean,reason:ChallengeVerdict)=>({schemaVersion:1,lessonId:'L47',origin:'block-simulation',criteria,program:structuredClone(program),passed,reason,elapsedMs:simulation.state.timeMs,units:{position:'m',heading:'rad',time:'ms'},trace,physicalVerification:'NOT RUN'});
 for(let step=0;step<=criteria.timeoutMs/20;step++){
  const state=simulation.state;
  const decision=challengeDecision(state,criteria);if(decision)return result(decision.passed,decision.reason);
  trace.push(simulation.step());
 }
 throw new Error('CHALLENGE_STEP_LIMIT');
}
export const challengeTestWorld=WorldSchema.parse({id:'L47-goal-test',width:3,height:2,start:{x:.5,y:1,heading:0},goal:{x:1.25,y:1,radius:.1},obstacles:[],line:[],robot:{noise:0,seed:1}});
export const challengeTestPrograms:{passing:Program;failing:Program}={passing:{setup:[{kind:'drive',left:50,right:50},{kind:'wait',ms:3000},{kind:'stop'}],loop:[]},failing:{setup:[{kind:'stop'}],loop:[{kind:'wait',ms:20}]}};

