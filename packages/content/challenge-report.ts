import {z} from 'zod';
import {validateProgram,type Program} from '../codegen';
import {RobotStateSchema} from '../simulator';
import {ChallengeTestSchema,challengeDecision} from './challenge-test';
const program=z.object({setup:z.array(z.unknown()).max(1000),loop:z.array(z.unknown()).max(1000)}).strict().refine(value=>{try{if(JSON.stringify(value).length>100000)return false;validateProgram(value as Program);return true;}catch{return false;}},'INVALID_PROGRAM').transform(value=>value as Program);
/** Checks report consistency; does not independently certify the physics or hardware. */
export const ChallengeReportSchema=z.object({schemaVersion:z.literal(1),lessonId:z.literal('L47'),origin:z.literal('block-simulation'),criteria:ChallengeTestSchema,program,passed:z.boolean(),reason:z.enum(['goal-reached','collision','program-error','completed-without-goal','timeout','duration-passed','completed']),elapsedMs:z.number().int().min(0).max(6000),units:z.object({position:z.literal('m'),heading:z.literal('rad'),time:z.literal('ms')}).strict(),trace:z.array(RobotStateSchema).min(1).max(301),physicalVerification:z.literal('NOT RUN')}).strict().superRefine((report,ctx)=>{
 const first=report.trace[0]!,last=report.trace.at(-1)!;
 if(first.timeMs!==0||first.pose.x!==report.criteria.world.start.x||first.pose.y!==report.criteria.world.start.y||first.pose.heading!==report.criteria.world.start.heading)ctx.addIssue({code:'custom',message:'START_MISMATCH'});
 if(last.timeMs!==report.elapsedMs||report.elapsedMs>report.criteria.timeoutMs)ctx.addIssue({code:'custom',message:'ELAPSED_MISMATCH'});
 if(report.trace.some((state,i)=>i>0&&state.timeMs!==report.trace[i-1]!.timeMs+20&&!(state.status==='error'&&state.timeMs===report.trace[i-1]!.timeMs)))ctx.addIssue({code:'custom',message:'TRACE_TIME_MISMATCH'});
 if(report.trace.slice(0,-1).some(state=>challengeDecision(state,report.criteria)!==null))ctx.addIssue({code:'custom',message:'PAST_DECISIVE_RESULT'});
 const decision=challengeDecision(last,report.criteria);if(!decision||decision.passed!==report.passed||decision.reason!==report.reason)ctx.addIssue({code:'custom',message:'VERDICT_MISMATCH'});
});
