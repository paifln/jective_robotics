import {z} from 'zod';
import type {Program} from '../codegen';
import {RobotSimulation} from '../simulator';
import {createRepeatableWorld} from './repeatable-experiment';
export const MeasurementSeriesSchema=z.object({referenceMeters:z.number().finite().min(0).max(5),readings:z.array(z.number().finite().min(0).max(5).nullable()).min(1).max(300)}).strict();
/** Descriptive sample statistics, not a confidence interval or calibration certificate. */
export function summarizeMeasurements(value:unknown){
 const inputs=MeasurementSeriesSchema.parse(value),valid=inputs.readings.filter((n):n is number=>n!==null);
 if(valid.length===0)return {count:inputs.readings.length,validCount:0,missingCount:inputs.readings.length,minimum:null,maximum:null,mean:null,span:null,meanError:null};
 const minimum=Math.min(...valid),maximum=Math.max(...valid),mean=valid.reduce((sum,n)=>sum+n,0)/valid.length;
 return {count:inputs.readings.length,validCount:valid.length,missingCount:inputs.readings.length-valid.length,minimum,maximum,mean,span:maximum-minimum,meanError:mean-inputs.referenceMeters};
}
export const UncertaintyInputSchema=z.object({seed:z.number().int().min(0).max(0xffffffff),samples:z.number().int().min(1).max(300),noiseMeters:z.number().finite().min(0).max(.2)}).strict();
export const stationaryProgram:Program={setup:[{kind:'stop'}],loop:[{kind:'wait',ms:20}]};
/** Collects actual stationary simulator readings; never substitutes them for physical observations. */
export function runSensorUncertainty(value:unknown){
 const inputs=UncertaintyInputSchema.parse(value),world=createRepeatableWorld(inputs.seed,inputs.noiseMeters),referenceMeters=1.5;
 const simulation=new RobotSimulation(structuredClone(stationaryProgram),world),trace=Array.from({length:inputs.samples},()=>simulation.step()),readings=trace.map(state=>state.distance);
 return {schemaVersion:1,lessonId:'L46',origin:'block-simulation',units:{distance:'m',time:'ms'},inputs,world,program:structuredClone(stationaryProgram),referenceMeters,readings,summary:summarizeMeasurements({referenceMeters,readings}),trace,physicalVerification:'NOT RUN'};
}
/** Manual values retain their limited provenance; no connected-hardware verification is implied. */
export function describeEnteredMeasurements(value:unknown){const inputs=MeasurementSeriesSchema.parse(value);return {origin:'learner-entered',units:{distance:'m'},inputs,summary:summarizeMeasurements(inputs),physicalVerification:'NOT RUN'};}
