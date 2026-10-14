import {z} from 'zod';
import {RepeatableInputSchema,runRepeatableExperiment} from './repeatable-experiment';
export const RepeatableRequestSchema=z.object({operationId:z.uuid(),inputs:RepeatableInputSchema}).strict();
export function processRepeatableRequest(value:unknown){
 const id=typeof value==='object'&&value!==null&&'operationId' in value?z.uuid().safeParse(value.operationId):null;const operationId=id?.success?id.data:'';
 try{const request=RepeatableRequestSchema.parse(value);return {operationId:request.operationId,ok:true as const,report:runRepeatableExperiment(request.inputs)};}catch(error){return {operationId,ok:false as const,error:String(error).slice(0,2000)};}
}
export type RepeatableReply=ReturnType<typeof processRepeatableRequest>;
