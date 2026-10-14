import {z} from 'zod';
import {RobotStateSchema} from '../simulator';
import {obstacleStopExperiment,obstacleStopProgram,type ObstacleStopCase} from './obstacle-stop';
import type {LessonArtifact} from './index';
import {steeringWorld} from './differential-experiment';
export const integrationCases=['far','boundary','lost-then-restored','ray-obstacle'] as const;
export const IntegrationCaseSchema=z.enum(integrationCases);
const traceSchema=z.array(RobotStateSchema).min(2).max(151).refine(trace=>trace.every((state,i)=>i===0?state.timeMs===0:state.timeMs>trace[i-1]!.timeMs||(i===trace.length-1&&state.status==='error'&&state.timeMs===trace[i-1]!.timeMs)),'INTEGRATION_TIME_ORDER');
/** Bounded component observations for this prototype; not general program validation. */
export function inspectIntegratedTrace(value:unknown,caseValue:unknown){
 const trace=traceSchema.parse(value),scenario=IntegrationCaseSchema.parse(caseValue),final=trace.at(-1)!,latched=trace.findIndex(s=>s.variables.stopped===1);
 const logs=final.log,stopMarker=scenario==='lost-then-restored'?'INVALID_STOP':'THRESHOLD_STOP';
 const sensing=scenario==='ray-obstacle'?trace.every(s=>s.distanceSource==='ray')&&trace.some(s=>s.distanceStatus==='valid'&&s.distance!==null):scenario==='lost-then-restored'?trace.some(s=>s.distanceStatus==='missing')&&final.distanceStatus==='valid':trace.every(s=>s.distanceSource==='injected'&&s.distanceStatus==='valid');
 const decision=scenario==='far'?latched===-1&&logs.some(s=>/^\d+ ms: CLEAR$/.test(s)):latched>=0&&trace.slice(latched).every(s=>s.variables.stopped===1)&&logs.some(s=>s.endsWith(': '+stopMarker));
 const actuation=final.status==='completed'&&final.left===0&&final.right===0&&trace.every(s=>!s.collision)&&(scenario!=='far'||trace.some(s=>s.left>0&&s.right>0));
 const telemetry=logs.length>0&&logs.every(s=>/^\d+ ms: (CLEAR|INVALID_STOP|THRESHOLD_STOP)$/.test(s))&&logs.some(s=>scenario==='far'?s.endsWith(': CLEAR'):s.endsWith(': '+stopMarker));
 const checks={sensing,decision,actuation,telemetry};
 return {checks,passed:Object.values(checks).every(Boolean),status:final.status,latchedAtMs:latched<0?null:trace[latched]!.timeMs,settledAtMs:latched<0?null:trace.slice(latched).find(s=>s.left===0&&s.right===0)?.timeMs??null};
}
export function runIntegratedPrototype(thresholdMeters=.3,guardInvalid=true){
 const program=obstacleStopProgram(thresholdMeters,guardInvalid);
 const cases=integrationCases.map(scenario=>{const experiment=obstacleStopExperiment(scenario as ObstacleStopCase,thresholdMeters,guardInvalid);return {scenario,experiment,review:inspectIntegratedTrace(experiment.trace,scenario)};});
 return {schemaVersion:1,lessonId:'L56',origin:'simulation',controller:'bounded-wall-stop-latched',thresholdMeters,guardInvalid,program,cases,passed:cases.every(c=>c.review.passed),limits:'Reuses the L25 controller and simulator. Injected inputs check logic; ray input checks modeled obstacle geometry. Two-second observation, 20 ms steps, equal wheel commands, modeled deceleration; no physical sensor, driver, telemetry transport or stopping-distance certification.',compilation:'NOT RUN by this simulation',upload:'NOT RUN',physicalVerification:'NOT RUN'} as const;
}
export const integratedPrototypeArtifact:LessonArtifact={starter:obstacleStopProgram(.3,false),reference:obstacleStopProgram(.3,true),world:{...structuredClone(steeringWorld),id:'L56-integrated-prototype',distanceInput:{initialMeters:1,events:[{timeMs:200,meters:null},{timeMs:400,meters:1}]}}};
