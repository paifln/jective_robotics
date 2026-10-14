import type {RobotState} from './index';
import {csvCell} from '../persistence/csv';
export interface DashboardPoint {timeMs:number;analogVolts:number;distanceMeters:number|null;distanceStatus:'valid'|'invalid'}
/** Only committed learner-program samples are exported. A retained distance is not a measurement. */
export function dashboardSeries(trace:Pick<RobotState,'timeMs'|'variables'>[],referenceVolts:number,maximumMeters:number):DashboardPoint[]{
 if(!Number.isFinite(referenceVolts)||referenceVolts<=0||referenceVolts>3.3||!Number.isFinite(maximumMeters)||maximumMeters<.2||maximumMeters>5)throw new Error('DASHBOARD_RANGE_CONFIG');
 const result:DashboardPoint[]=[];
 for(const state of trace){const v=state.variables,timeMs=v.dashboard_time_ms;
  if(timeMs===undefined||v.dashboard_commit!==timeMs+1)continue;
  const analogVolts=v.dashboard_analog_v,valid=v.dashboard_distance_valid;
  if(!Number.isInteger(timeMs)||timeMs<0||timeMs>state.timeMs||timeMs>120000||analogVolts===undefined||!Number.isFinite(analogVolts)||analogVolts<0||analogVolts>referenceVolts||(valid!==0&&valid!==1))throw new Error('DASHBOARD_SAMPLE_INVALID');
  const distanceMeters=valid===1?v.dashboard_distance_m:null;
  if(valid===1&&(distanceMeters===undefined||distanceMeters===null||!Number.isFinite(distanceMeters)||distanceMeters<0||distanceMeters>maximumMeters))throw new Error('DASHBOARD_DISTANCE_INVALID');
  const point:DashboardPoint={timeMs,analogVolts,distanceMeters:distanceMeters??null,distanceStatus:valid===1?'valid':'invalid'};const previous=result.at(-1);
  if(previous&&timeMs<previous.timeMs)throw new Error('DASHBOARD_TIME_ORDER');
  if(previous&&timeMs===previous.timeMs){if(JSON.stringify(previous)!==JSON.stringify(point))throw new Error('DASHBOARD_SAMPLE_CONFLICT');continue;}
  result.push(point);
 }return result;
}
export function dashboardCSV(points:DashboardPoint[]){return 'origin,time_ms,analog_V,distance_m,distance_status\r\n'+points.map(p=>['simulation',p.timeMs,p.analogVolts,p.distanceMeters??'',p.distanceStatus].map(csvCell).join(',')).join('\r\n');}
