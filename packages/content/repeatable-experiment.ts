import {z} from 'zod';
import type {Program} from '../codegen';
import {RobotSimulation,WorldSchema,type RobotState} from '../simulator';
export const RepeatableInputSchema=z.object({seed:z.number().int().min(0).max(0xffffffff),comparisonSeed:z.number().int().min(0).max(0xffffffff),steps:z.number().int().min(1).max(300),noiseMeters:z.number().min(0).max(.2)}).strict();
function stoppingProgram(threshold:number):Program{return {setup:[],loop:[{kind:'if',condition:{kind:'binary',op:'&&',left:{kind:'sensor',sensor:'distanceValid'},right:{kind:'binary',op:'>',left:{kind:'sensor',sensor:'distance'},right:{kind:'number',value:threshold}}},then:[{kind:'drive',left:50,right:50}],otherwise:[{kind:'stop'}]},{kind:'wait',ms:20}]};}
export const repeatablePrograms={near:stoppingProgram(.4),early:stoppingProgram(.7)};
export function createRepeatableWorld(seed:number,noiseMeters:number){return WorldSchema.parse({id:'L44-repeatable-world',width:4,height:3,start:{x:.5,y:1.5,heading:0},goal:{x:1.5,y:1.5,radius:.2},obstacles:[{x:2,y:.5,width:.2,height:2}],line:[],robot:{noise:noiseMeters,seed}});}
/** Runs bounded supported block IR through the real simulator, never arbitrary C++. */
export function runRepeatableExperiment(value:unknown){
 const inputs=RepeatableInputSchema.parse(value);
 const world=createRepeatableWorld(inputs.seed,inputs.noiseMeters);
 const trace=(program:Program,seed:number):RobotState[]=>{const sim=new RobotSimulation(structuredClone(program),WorldSchema.parse({...world,robot:{...world.robot,seed}}));return Array.from({length:inputs.steps},()=>sim.step());};
 const compare=(program:Program)=>{const first=trace(program,inputs.seed),repeat=trace(program,inputs.seed),changedSeed=trace(program,inputs.comparisonSeed);return {first,repeat,changedSeed,sameSeedMatches:JSON.stringify(first)===JSON.stringify(repeat),changedSeedDiffers:JSON.stringify(first)!==JSON.stringify(changedSeed)};};
 return {schemaVersion:1,lessonId:'L44',origin:'block-simulation',units:{position:'m',heading:'rad',time:'ms',noise:'m'},fixedStepMs:20,inputs,world,programs:structuredClone(repeatablePrograms),runs:{near:compare(repeatablePrograms.near),early:compare(repeatablePrograms.early)},physicalVerification:'NOT RUN'};
}
