import {z} from 'zod';
import {RobotSimulation,WorldSchema,type World,type RobotState} from '../simulator';
import {repeatablePrograms} from './repeatable-experiment';
import {collisionCases} from './collision-cases';
export const InvestigationInputSchema=z.object({seed:z.number().int().min(0).max(0xffffffff),repetitions:z.number().int().min(1).max(5),steps:z.number().int().min(1).max(300),noiseMeters:z.number().min(0).max(.2),worlds:z.array(z.enum(['clear','wall','narrow'])).min(2).max(3).refine(ids=>new Set(ids).size===ids.length,'DUPLICATE_WORLD')}).strict();
export const investigationWorlds:Record<'clear'|'wall'|'narrow',World>={clear:WorldSchema.parse({id:'L48-clear',width:4,height:3,start:{x:.5,y:1.5,heading:0},goal:{x:1.5,y:1.5,radius:.1},obstacles:[],line:[],robot:{noise:0,seed:1}}),wall:WorldSchema.parse({...collisionCases.wall,id:'L48-wall',goal:{x:1.5,y:1.5,radius:.1}}),narrow:WorldSchema.parse({...collisionCases.narrow,id:'L48-narrow'})};
export function investigationMetrics(trace:RobotState[]){if(!trace.length)throw new Error('EMPTY_TRACE');return {goalSeen:trace.some(s=>s.goal),collisionSeen:trace.some(s=>s.collision),invalidDistanceSeen:trace.some(s=>s.distanceStatus!=='valid'),firstGoalMs:trace.find(s=>s.goal)?.timeMs??null,elapsedMs:trace.at(-1)!.timeMs,final:structuredClone(trace.at(-1)!)};}
/** Paired trials use the same world, seed, noise and observation window for both strategies. */
export function runNavigationInvestigation(value:unknown){
 const inputs=InvestigationInputSchema.parse(value);
 const trials=inputs.worlds.flatMap(worldId=>Array.from({length:inputs.repetitions},(_,repetition)=>{
  const seed=(inputs.seed+repetition)>>>0,world=WorldSchema.parse({...investigationWorlds[worldId],robot:{...investigationWorlds[worldId].robot,seed,noise:inputs.noiseMeters}});
  const execute=(key:'near'|'early')=>{const simulation=new RobotSimulation(structuredClone(repeatablePrograms[key]),structuredClone(world));const trace=Array.from({length:inputs.steps},()=>simulation.step());return {trace,metrics:investigationMetrics(trace)};};
  return {worldId,repetition,seed,world,runs:{near:execute('near'),early:execute('early')}};
 }));
 return {schemaVersion:1,lessonId:'L48',origin:'block-simulation',inputs,programs:structuredClone(repeatablePrograms),fixedStepMs:20,units:{position:'m',heading:'rad',time:'ms',noise:'m'},trials,physicalVerification:'NOT RUN'};
}
