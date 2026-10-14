import {z} from 'zod';
import {runCollisionCases} from './collision-cases';
export const CollisionRequestSchema=z.object({operationId:z.uuid()}).strict();
export function processCollisionRequest(value:unknown){
 const id=typeof value==='object'&&value!==null&&'operationId' in value?z.uuid().safeParse(value.operationId):null;
 const operationId=id?.success?id.data:'';
 try{const request=CollisionRequestSchema.parse(value);return {operationId:request.operationId,ok:true as const,report:runCollisionCases()};}
 catch(error){return {operationId,ok:false as const,error:String(error).slice(0,2000)};}
}
export type CollisionReply=ReturnType<typeof processCollisionRequest>;
