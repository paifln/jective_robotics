import {z} from 'zod';
import {ChallengeTestSchema,challengeTestWorld,challengeTestPrograms,evaluateChallenge} from './challenge-test';
export const ChallengeInputsSchema=ChallengeTestSchema.pick({timeoutMs:true,requireGoal:true,forbidCollisions:true});
export const ChallengeRequestSchema=z.object({operationId:z.uuid(),inputs:ChallengeInputsSchema}).strict();
export function processChallengeRequest(value:unknown){
 const id=typeof value==='object'&&value!==null&&'operationId' in value?z.uuid().safeParse(value.operationId):null;const operationId=id?.success?id.data:'';
 try{const request=ChallengeRequestSchema.parse(value),criteria={...request.inputs,world:structuredClone(challengeTestWorld)};return {operationId:request.operationId,ok:true as const,reports:{moving:evaluateChallenge(challengeTestPrograms.passing,criteria),stationary:evaluateChallenge(challengeTestPrograms.failing,criteria)}};}
 catch(error){return {operationId,ok:false as const,error:String(error).slice(0,2000)};}
}
export type ChallengeReply=ReturnType<typeof processChallengeRequest>;
