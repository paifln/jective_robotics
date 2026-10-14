import {z} from 'zod';
import {InvestigationInputSchema,runNavigationInvestigation} from './navigation-investigation';
export const InvestigationRequestSchema=z.object({operationId:z.uuid(),inputs:InvestigationInputSchema}).strict();
export function processInvestigationRequest(value:unknown){const id=typeof value==='object'&&value!==null&&'operationId' in value?z.uuid().safeParse(value.operationId):null;const operationId=id?.success?id.data:'';try{const request=InvestigationRequestSchema.parse(value);return {operationId:request.operationId,ok:true as const,report:runNavigationInvestigation(request.inputs)};}catch(error){return {operationId,ok:false as const,error:String(error).slice(0,2000)};}}
export type InvestigationReply=ReturnType<typeof processInvestigationRequest>;
