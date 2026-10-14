import {RobotSimulation,type RobotState} from '../simulator';
import type {Program} from '../codegen';
import {steeringWorld} from './differential-experiment';

export interface SquareRouteSettings {
 straightMs:number;
 turnMs:number;
 trackMeters:number;
 /** Command asymmetry, not measured motor noise or motor detection. */
 rightCommandOffset:number;
 repetitions:number;
}
export const squareRouteDefaults:SquareRouteSettings={straightMs:1000,turnMs:1000,trackMeters:.18,rightCommandOffset:0,repetitions:3};
function validate(settings:SquareRouteSettings){
 const times=[settings.straightMs,settings.turnMs];
 if(!times.every(value=>Number.isInteger(value)&&value>=400&&value<=2000&&value%20===0)
  ||!Number.isFinite(settings.trackMeters)||settings.trackMeters<.15||settings.trackMeters>.25
  ||!Number.isFinite(settings.rightCommandOffset)||Math.abs(settings.rightCommandOffset)>5
  ||!Number.isInteger(settings.repetitions)||settings.repetitions<2||settings.repetitions>10)throw new Error('SQUARE_ROUTE_CONFIG');
}
export function squareRouteProgram(settings:SquareRouteSettings=squareRouteDefaults):Program{
 validate(settings);
 const setup:Program['setup']=[];
 for(let side=0;side<4;side++)setup.push(
  {kind:'drive',left:20,right:20+settings.rightCommandOffset},
  {kind:'wait',ms:settings.straightMs},{kind:'stop'},{kind:'wait',ms:200},
  {kind:'drive',left:-20,right:20+settings.rightCommandOffset},
  {kind:'wait',ms:settings.turnMs},{kind:'stop'},{kind:'wait',ms:200});
 return {setup,loop:[]};
}
export function squareRouteTrials(settings:SquareRouteSettings=squareRouteDefaults){
 validate(settings);
 const world=structuredClone(steeringWorld);world.id='L24-square-calibration';
 world.robot!.track=settings.trackMeters;
 const program=squareRouteProgram(settings);
 const rows=[];
 for(let trial=1;trial<=settings.repetitions;trial++){
  const simulation=new RobotSimulation(program,world),trace:RobotState[]=[structuredClone(simulation.state)];
  for(let tick=0;tick<1100;tick++){
   const state=simulation.step();trace.push(state);
   if(['completed','error','cancelled'].includes(state.status))break;
  }
  const final=trace.at(-1)!;
  if(final.status!=='completed'||trace.some(state=>state.collision))throw new Error('SQUARE_ROUTE_FAILED');
  const deltaX=final.pose.x-world.start.x,deltaY=final.pose.y-world.start.y;
  const headingError=Math.atan2(Math.sin(final.pose.heading-world.start.heading),Math.cos(final.pose.heading-world.start.heading));
  const cycleMs=settings.straightMs+settings.turnMs+400;
  const sample=(timeMs:number)=>{const state=trace.find(state=>state.timeMs===timeMs);if(!state)throw new Error('SQUARE_PHASE_SAMPLE_MISSING');return state;};
  const sides=Array.from({length:4},(_,index)=>{
   const start=sample(index*cycleMs),corner=sample(index*cycleMs+settings.straightMs+200),afterTurn=sample((index+1)*cycleMs);
   const straightHeadingChangeRadians=corner.pose.heading-start.pose.heading,turnRadians=afterTurn.pose.heading-corner.pose.heading;
   return {side:index+1,startTimeMs:start.timeMs,cornerTimeMs:corner.timeMs,afterTurnTimeMs:afterTurn.timeMs,
    start:structuredClone(start.pose),corner:structuredClone(corner.pose),afterTurn:structuredClone(afterTurn.pose),
    chordMeters:Math.hypot(corner.pose.x-start.pose.x,corner.pose.y-start.pose.y),straightHeadingChangeRadians,turnRadians,turnErrorRadians:turnRadians-Math.PI/2};
  });
  rows.push({trial,deltaX,deltaY,endpointErrorMeters:Math.hypot(deltaX,deltaY),headingErrorRadians:headingError,completionMs:final.timeMs,sides,trace});
 }
 const errors=rows.map(row=>row.endpointErrorMeters);
 return {schemaVersion:1,origin:'simulation',settings:{...settings},world,program,rows,
  summary:{meanEndpointErrorMeters:errors.reduce((sum,value)=>sum+value,0)/errors.length,minEndpointErrorMeters:Math.min(...errors),maxEndpointErrorMeters:Math.max(...errors),rangeEndpointErrorMeters:Math.max(...errors)-Math.min(...errors)},
  assumptions:'Repeated identical deterministic conditions. Track is a geometry parameter; rightCommandOffset is an explicit command asymmetry, not a fitted motor model. Closure alone does not prove square geometry or side length.',
  units:{position:'m',heading:'rad',duration:'ms',command:'percent'},physicalVerification:'NOT RUN'} as const;
}
export function compareSquareRevision(baseline:SquareRouteSettings,revision:SquareRouteSettings,justification:string){
 if(typeof justification!=='string'||justification.trim().length<10||justification.length>2000)throw new Error('SQUARE_REVISION_JUSTIFICATION');
 return {schemaVersion:1,lessonId:'L24',justification:justification.trim(),baseline:squareRouteTrials(baseline),revision:squareRouteTrials(revision)} as const;
}
