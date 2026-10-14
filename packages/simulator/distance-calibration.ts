import {RobotSimulation,worlds} from './index';
import {csvCell} from '../persistence/csv';
export interface CalibrationTrial {targetMeters:number|null;trial:number;reportedMeters:number|null;status:'valid'|'missing'|'outOfRange';source:'ray'|'injected';errorMeters:number|null;noiseMeters:number;seed:number;maximumMeters:number}
export function distanceCalibration(repetitions=3,noise=0,seed=1):CalibrationTrial[]{
 if(!Number.isInteger(repetitions)||repetitions<1||repetitions>10)throw new Error('CALIBRATION_REPETITIONS_RANGE');
 if(!Number.isFinite(noise)||noise<0||noise>.2)throw new Error('CALIBRATION_NOISE_RANGE');
 if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw new Error('CALIBRATION_SEED_RANGE');
 const result:CalibrationTrial[]=[];
 for(const targetMeters of [.2,.5,1,1.5,2,2.1,null])for(let trial=1;trial<=repetitions;trial++){
  const base=worlds[0]!;const world={...base,obstacles:targetMeters===null?[]:[{x:base.start.x+targetMeters,y:1,width:.1,height:1}],robot:{distanceMax:2,noise,seed:(seed+trial-1)>>>0},...(targetMeters===null?{distanceInput:{initialMeters:null,events:[]}}:{})};
  const state=new RobotSimulation({setup:[],loop:[]},world).state;
  result.push({targetMeters,trial,reportedMeters:state.distance,status:state.distanceStatus,source:state.distanceSource,errorMeters:state.distance===null||targetMeters===null?null:state.distance-targetMeters,noiseMeters:noise,seed:world.robot.seed,maximumMeters:2});
 }
 return result;
}
export function calibrationCSV(trials:CalibrationTrial[]){return [['origin','target_m','trial','reported_m','status','source','error_m','noise_m','seed','maximum_m'],...trials.map(row=>['simulation',row.targetMeters??'',row.trial,row.reportedMeters??'',row.status,row.source,row.errorMeters??'',row.noiseMeters,row.seed,row.maximumMeters])].map(row=>row.map(csvCell).join(',')).join('\r\n');}
