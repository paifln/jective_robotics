import {z} from 'zod';
import {UncertaintyInputSchema,runSensorUncertainty} from './sensor-uncertainty';
export const UncertaintyRequestSchema=z.object({operationId:z.uuid(),inputs:UncertaintyInputSchema}).strict();
export function processUncertaintyRequest(value:unknown){
 const id=typeof value==='object'&&value!==null&&'operationId' in value?z.uuid().safeParse(value.operationId):null;const operationId=id?.success?id.data:'';
 try{const request=UncertaintyRequestSchema.parse(value);return {operationId:request.operationId,ok:true as const,report:runSensorUncertainty(request.inputs)};}
 catch(error){return {operationId,ok:false as const,error:String(error).slice(0,2000)};}
}
export type UncertaintyReply=ReturnType<typeof processUncertaintyRequest>;
