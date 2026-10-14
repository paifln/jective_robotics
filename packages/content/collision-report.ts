import {z} from 'zod';
import {RobotStateSchema,WorldSchema} from '../simulator';
import {collisionCases,guardedMotion,unguardedMotion} from './collision-cases';
const canonical=(value:unknown)=>JSON.stringify(value,(_key,item:unknown)=>item!==null&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
const exact=(expected:unknown)=>z.unknown().refine(value=>canonical(value)===canonical(expected),'LESSON_SNAPSHOT_MISMATCH');
const run=z.object({collisionSeen:z.boolean(),invalidDistanceSeen:z.boolean(),final:RobotStateSchema,trace:z.array(RobotStateSchema).length(300)}).strict().superRefine((value,ctx)=>{
 if(value.trace.some((state,i)=>{const previous=value.trace[i-1];return previous?.status==='completed'?canonical(state)!==canonical(previous):state.timeMs!==(previous?.timeMs??0)+20;}))ctx.addIssue({code:'custom',message:'TRACE_TIME_MISMATCH'});
 if(JSON.stringify(value.final)!==JSON.stringify(value.trace.at(-1)))ctx.addIssue({code:'custom',message:'FINAL_STATE_MISMATCH'});
 if(value.collisionSeen!==value.trace.some(state=>state.collision))ctx.addIssue({code:'custom',message:'COLLISION_SUMMARY_MISMATCH'});
 if(value.invalidDistanceSeen!==value.trace.some(state=>state.distanceStatus!=='valid'))ctx.addIssue({code:'custom',message:'DISTANCE_SUMMARY_MISMATCH'});
});
const scenario=(world:unknown)=>z.object({world:WorldSchema.refine(value=>canonical(value)===canonical(world),'SCENARIO_WORLD_MISMATCH'),starter:run,corrected:run}).strict();
const invalidWorld={...collisionCases.wall!,start:{x:0,y:1.5,heading:0}};
/** Validates bounded traces and their summaries; does not certify physical safety. */
export const CollisionReportSchema=z.object({schemaVersion:z.literal(1),lessonId:z.literal('L45'),origin:z.literal('block-simulation'),fixedStepMs:z.literal(20),units:z.object({position:z.literal('m'),heading:z.literal('rad'),time:z.literal('ms')}).strict(),programs:z.object({starter:exact(unguardedMotion),corrected:exact(guardedMotion)}).strict(),cases:z.object({wall:scenario(collisionCases.wall),narrow:scenario(collisionCases.narrow),range:scenario(collisionCases.range)}).strict(),invalidStart:z.object({world:exact(invalidWorld),rejected:z.literal(true)}).strict(),physicalVerification:z.literal('NOT RUN')}).strict();
