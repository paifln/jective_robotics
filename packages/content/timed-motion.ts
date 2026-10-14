import {RobotSimulation,type RobotState} from '../simulator';
import {steeringWorld} from './differential-experiment';
import type {Program} from '../codegen';
export interface TimedTrial {trial:number;maximumSpeedMps:number;trackMeters:number;straightMeters:number;headingRadians:number;endpointX:number;endpointY:number;completionMs:number;trace:RobotState[]}
export function timedMotionProgram():Program{return {setup:[{kind:'drive',left:20,right:20},{kind:'wait',ms:1000},{kind:'stop'},{kind:'wait',ms:200},{kind:'drive',left:-20,right:20},{kind:'wait',ms:1000},{kind:'stop'},{kind:'wait',ms:200}],loop:[]};}
export function timedMotionTrials(repetitions=5,variation=.1,seed=23){
 if(!Number.isInteger(repetitions)||repetitions<2||repetitions>10||!Number.isFinite(variation)||variation<0||variation>.2||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new Error('TIMED_TRIAL_CONFIG');
 let randomState=seed;const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296*2-1;};
 const rows:TimedTrial[]=[];const program=timedMotionProgram();
 for(let trial=1;trial<=repetitions;trial++){
  const world=structuredClone(steeringWorld);world.id='L23-timed-variation';const robot=world.robot!;robot.maxSpeed=.6*(1+variation*random());robot.track=.18*(1+variation*random());
  const simulation=new RobotSimulation(program,world),trace=[structuredClone(simulation.state)];
  for(let tick=0;tick<150;tick++){const state=simulation.step();trace.push(state);if(['completed','error','cancelled'].includes(state.status))break;}
  const final=trace.at(-1)!;if(final.status!=='completed'||trace.some(state=>state.collision))throw new Error('TIMED_TRIAL_FAILED');
  const straight=trace.find(state=>state.timeMs===1200)!;
  rows.push({trial,maximumSpeedMps:robot.maxSpeed,trackMeters:robot.track,straightMeters:Math.hypot(straight.pose.x-world.start.x,straight.pose.y-world.start.y),headingRadians:final.pose.heading,endpointX:final.pose.x,endpointY:final.pose.y,completionMs:final.timeMs,trace});
 }
 const stats=(key:'straightMeters'|'headingRadians')=>{const values=rows.map(row=>row[key]),mean=values.reduce((sum,value)=>sum+value,0)/values.length,min=Math.min(...values),max=Math.max(...values);return {mean,min,max,range:max-min};};
 return {schemaVersion:1,origin:'simulation',repetitions,variationFraction:variation,seed,variationModel:'Explicit per-trial speed/track parameter assumptions; not measured motor noise or a fitted statistical distribution',baseWorld:structuredClone(steeringWorld),program,rows,summary:{straight:stats('straightMeters'),turn:stats('headingRadians')},physicalVerification:'NOT RUN'} as const;
}
