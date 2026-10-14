import type {RobotState} from './index';
import {csvCell} from '../persistence/csv';
export interface AnalogPoint {timeMs:number;counts:number;volts:number}
/** Reads explicitly recorded program variables; never invents samples from the world model. */
export function analogSeries(trace:Pick<RobotState,'timeMs'|'variables'>[]):AnalogPoint[]{
 const result:AnalogPoint[]=[];let previous=-1;
 for(const state of trace){const {adc_time_ms:timeMs,adc_counts:counts,adc_volts:volts}=state.variables;
  if(timeMs===undefined||counts===undefined||volts===undefined)continue;
  if(!Number.isInteger(timeMs)||timeMs<0||timeMs>state.timeMs||!Number.isInteger(counts)||counts<0||counts>65535||!Number.isFinite(volts)||volts<0||volts>3.3)throw new Error('ANALOG_RECORDED_SAMPLE_INVALID');
  if(timeMs<previous)throw new Error('ANALOG_RECORDED_TIME_ORDER');if(timeMs===previous){const last=result.at(-1)!;if(last.counts!==counts||last.volts!==volts)throw new Error('ANALOG_RECORDED_SAMPLE_CONFLICT');continue;}previous=timeMs;result.push({timeMs,counts,volts});
 }return result;
}
export function analogCSV(points:AnalogPoint[]){return 'origin,time_ms,adc_counts,adc_volts\r\n'+points.map(point=>['simulation',point.timeMs,point.counts,point.volts].map(csvCell).join(',')).join('\r\n');}
