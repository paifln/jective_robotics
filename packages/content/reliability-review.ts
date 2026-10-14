import type {LessonArtifact} from './index';
import {z} from 'zod';
import {SafeMotorModel,motorSafetyExperiment} from '../simulator/safe-motor';
import {RobotSimulation,RobotStateSchema,type RobotState} from '../simulator';
import {steeringWorld} from './differential-experiment';
import {obstacleStopExperiment,obstacleStopProgram} from './obstacle-stop';

const sample=z.object({timeMs:z.number().int().min(0).max(500),left:z.number().finite().min(-30).max(30),right:z.number().finite().min(-30).max(30),mode:z.enum(['disarmed','tethered','autonomous']),fault:z.boolean()}).strict();
const motorTrace=z.array(sample).min(2).max(26).refine(trace=>trace.every((s,i)=>i===0?s.timeMs===0:s.timeMs>trace[i-1]!.timeMs),'MOTOR_TRACE_ORDER');
const robotTrace=z.array(RobotStateSchema).min(2).max(151);
const stopped=(s:{left:number;right:number})=>s.left===0&&s.right===0;

export function inspectCommunicationLoss(value:unknown){
 const samples=motorTrace.parse(value),at=samples.find(s=>s.timeMs===400);
 return {passed:!!at&&at.mode==='disarmed'&&stopped(at)&&samples.some(s=>s.timeMs>0&&s.timeMs<400&&s.mode==='tethered'&&s.left>0&&s.right>0)&&samples.filter(s=>s.timeMs>=400).every(s=>s.mode==='disarmed'&&stopped(s)),safeAtMs:at&&at.mode==='disarmed'&&stopped(at)?400:null};
}
export function resetExperiment(){
 const previous=new SafeMotorModel();previous.arm(0);previous.drive(10,10,1000,1,0);const beforeReset=[previous.tick(0)];for(let time=20;time<=200;time+=20)beforeReset.push(previous.tick(time));
 // Reset is a fresh model with its own zero-based clock, not a physical MCU reset.
 const reset=new SafeMotorModel(),driveAccepted=reset.drive(10,10,1000,1,0),afterReset=[reset.tick(0)];for(let time=20;time<=100;time+=20)afterReset.push(reset.tick(time));
 return {origin:'fresh-SafeMotorModel-instance',resetAtElapsedMs:200,beforeReset,afterReset,driveAccepted};
}
export function inspectReset(value:unknown){
 const r=z.object({beforeReset:motorTrace,afterReset:motorTrace,driveAccepted:z.boolean()}).parse(value);
 return {passed:r.beforeReset.some(s=>s.left>0&&s.right>0)&&!r.driveAccepted&&r.afterReset.every(s=>s.mode==='disarmed'&&!s.fault&&stopped(s)),safeAtMs:r.afterReset.every(s=>s.mode==='disarmed'&&stopped(s))?0:null};
}
export function blockedMovementExperiment(useGeometry=true){
 if(typeof useGeometry!=='boolean')throw new Error('RELIABILITY_CONFIG');
 const program=obstacleStopProgram(.3,true),world=structuredClone(steeringWorld);world.id='L57-blocked-movement';world.obstacles=[{x:1.65,y:1,width:.1,height:1}];if(!useGeometry)world.distanceInput={initialMeters:1,events:[]};
 const simulation=new RobotSimulation(program,world),trace:RobotState[]=[structuredClone(simulation.state)];for(let tick=0;tick<150;tick++){const state=simulation.step();trace.push(state);if(['completed','error','cancelled'].includes(state.status))break;}
 return {origin:'RobotSimulation',program,world,useGeometry,trace};
}
export function inspectObstacleFault(value:unknown,kind:'invalid-reading'|'blocked-movement'){
 const trace=robotTrace.parse(value),final=trace.at(-1)!,reason=kind==='invalid-reading'?'INVALID_STOP':'THRESHOLD_STOP',latched=trace.findIndex(s=>s.variables.stopped===1);
 const provenance=kind==='invalid-reading'?trace.some(s=>s.distanceStatus==='outOfRange'):trace.every(s=>s.distanceSource==='ray');
 return {passed:final.status==='completed'&&stopped(final)&&!trace.some(s=>s.collision)&&provenance&&latched>=0&&trace.slice(latched).every(s=>s.variables.stopped===1)&&final.log.some(line=>line.endsWith(': '+reason)),safeAtMs:latched<0?null:trace[latched]!.timeMs,status:final.status,collision:trace.some(s=>s.collision)};
}
export function runReliabilityCases(repaired:boolean){
 if(typeof repaired!=='boolean')throw new Error('RELIABILITY_CONFIG');
 const communication=motorSafetyExperiment('communication-loss'),reset=resetExperiment(),invalid=obstacleStopExperiment('out-of-range',.3,repaired),blocked=blockedMovementExperiment(repaired);
 return [
  {id:'communication-loss' as const,origin:'SafeMotorModel',experiment:communication,review:inspectCommunicationLoss(communication.samples)},
  {id:'reset' as const,origin:'fresh-SafeMotorModel-instance',experiment:reset,review:inspectReset(reset)},
  {id:'invalid-reading' as const,origin:'RobotSimulation',experiment:invalid,review:inspectObstacleFault(invalid.trace,'invalid-reading')},
  {id:'blocked-movement' as const,origin:'RobotSimulation',experiment:blocked,review:inspectObstacleFault(blocked.trace,'blocked-movement')}
 ] as const;
}
/** Retest every case; retain original failures instead of replacing them with green flags. */
export function runReliabilityReview(){
 const initial=runReliabilityCases(false),retest=runReliabilityCases(true);
 const issues=initial.filter(c=>!c.review.passed).map(c=>({id:c.id,observed:c.review,repair:c.id==='invalid-reading'?'Check distance validity before comparison.':'Remove the deliberately incorrect injected clear-distance override; use actual model obstacle geometry.',retest:retest.find(r=>r.id===c.id)!.review,scope:'model-only'}));
 return {schemaVersion:1,lessonId:'L57',origin:'executed-model-cases',initial,retest,issues,passed:retest.every(c=>c.review.passed),limits:'Communication and reset use the existing SafeMotorModel, not a live serial link or MCU. Obstacle cases use RobotSimulation, not encoder stall detection. Tethered authority timeout is 400 ms; autonomous operation is a separate policy. Geometry input repair is not a physical sensor calibration. No physical safety certification.',compilation:'NOT RUN by this experiment',upload:'NOT RUN',physicalVerification:'NOT RUN'} as const;
}

export const reliabilityReviewArtifact:LessonArtifact={starter:obstacleStopProgram(.3,false),reference:obstacleStopProgram(.3,true),world:{...structuredClone(steeringWorld),id:'L57-invalid-reading',distanceInput:{initialMeters:3,events:[]}}};
