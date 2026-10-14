import type {Program,Instruction} from '../codegen';
import {RobotSimulation,type RobotState} from '../simulator';
import {steeringWorld} from './differential-experiment';
export const obstacleStopCases=['far','near','boundary','above-boundary','missing','out-of-range','lost-then-restored','ray-obstacle'] as const;
export type ObstacleStopCase=typeof obstacleStopCases[number];
export const obstacleObservationMs=2000;
/** A bounded demonstration with latched stop; resetting is an explicit new run. */
export function obstacleStopProgram(thresholdMeters=.3,guardInvalid=true):Program{
 if(!Number.isFinite(thresholdMeters)||thresholdMeters<.2||thresholdMeters>.8||typeof guardInvalid!=='boolean')throw new Error('OBSTACLE_STOP_CONFIG');
 const decision:Instruction={kind:'if',condition:{kind:'binary',op:'>',left:{kind:'sensor',sensor:'distance'},right:{kind:'number',value:thresholdMeters}},then:[{kind:'drive',left:20,right:20},{kind:'print',text:'CLEAR'}],otherwise:[{kind:'set',name:'stopped',value:{kind:'number',value:1}},{kind:'stop'},{kind:'print',text:'THRESHOLD_STOP'}]};
 const guarded:Instruction=guardInvalid?{kind:'if',condition:{kind:'sensor',sensor:'distanceValid'},then:[decision],otherwise:[{kind:'set',name:'stopped',value:{kind:'number',value:1}},{kind:'stop'},{kind:'print',text:'INVALID_STOP'}]}:decision;
 return {setup:[{kind:'set',name:'stopped',value:{kind:'number',value:0}},{kind:'repeat',count:obstacleObservationMs/20,body:[{kind:'if',condition:{kind:'not',value:{kind:'variable',name:'stopped'}},then:[guarded],otherwise:[{kind:'stop'}]},{kind:'wait',ms:20}]},{kind:'stop'},{kind:'wait',ms:200}],loop:[]};
}
export function obstacleStopExperiment(scenario:ObstacleStopCase,thresholdMeters=.3,guardInvalid=true){
 if(!obstacleStopCases.includes(scenario))throw new Error('OBSTACLE_STOP_CASE');
 const program=obstacleStopProgram(thresholdMeters,guardInvalid),world=structuredClone(steeringWorld);world.id='L25-'+scenario;
 const initialMeters=scenario==='near'?.1:scenario==='boundary'?thresholdMeters:scenario==='above-boundary'?thresholdMeters+.000001:scenario==='missing'?null:scenario==='out-of-range'?3:1;
 if(scenario==='ray-obstacle')world.obstacles=[{x:1.84,y:1,width:.1,height:1}];
 else world.distanceInput={initialMeters,events:scenario==='lost-then-restored'?[{timeMs:200,meters:null},{timeMs:400,meters:1}]:[]};
 const simulation=new RobotSimulation(program,world),trace:RobotState[]=[structuredClone(simulation.state)];
 for(let tick=0;tick<150;tick++){const state=simulation.step();trace.push(state);if(['completed','error','cancelled'].includes(state.status))break;}
 const final=trace.at(-1)!;
 const stopLog=final.log.find(line=>/^\d+ ms: (INVALID_STOP|THRESHOLD_STOP)$/.test(line));
 const requestedAtMs=final.status==='error'?null:stopLog?Number(stopLog.split(' ')[0]):obstacleObservationMs;
 const requestState=requestedAtMs===null?undefined:trace.find(state=>state.timeMs===requestedAtMs);
 const settled=requestedAtMs===null?undefined:trace.find(state=>state.timeMs>=requestedAtMs&&state.left===0&&state.right===0);
 const stopping=requestState&&settled?{
  reason:stopLog?.endsWith('INVALID_STOP')?'invalid-reading':stopLog?'threshold':'bounded-finish',
  requestedAtMs,settledAtMs:settled.timeMs,settlingMs:settled.timeMs-requestState.timeMs,
  travelAfterRequestMeters:Math.hypot(settled.pose.x-requestState.pose.x,settled.pose.y-requestState.pose.y),
  centerClearanceMeters:scenario==='ray-obstacle'?world.obstacles[0]!.x-settled.pose.x:null,
  bodyClearanceMeters:scenario==='ray-obstacle'?world.obstacles[0]!.x-settled.pose.x-world.robot!.radius:null
 }:null;
 return {schemaVersion:1,lessonId:'L25',origin:'simulation',scenario,thresholdMeters,guardInvalid,world,program,trace,
  stopping,
  displacementMeters:Math.hypot(final.pose.x-world.start.x,final.pose.y-world.start.y),
  assumptions:scenario==='ray-obstacle'?'Ray-cast distance to a world obstacle, measured from the modeled robot center. Checks occur every 20 ms; stop latches until a new run and model velocity decays. No physical stopping-distance certification.':'Injected readings test control logic, not an actual obstacle position. Checks occur every 20 ms. Stop requests latch until a new run; velocity decays under model acceleration. No physical stopping-distance certification.',physicalVerification:'NOT RUN'} as const;
}
