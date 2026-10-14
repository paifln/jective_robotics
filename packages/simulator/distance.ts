import {z} from 'zod';
const value=z.number().finite().min(0).max(1000).nullable();
export const DistanceInputSchema=z.object({initialMeters:value,events:z.array(z.object({timeMs:z.number().int().min(0).max(119999),meters:value}).strict()).max(2000)}).strict().refine(model=>model.events.every((event,index)=>index===0||event.timeMs>model.events[index-1]!.timeMs),'DISTANCE_EVENT_ORDER');
export type DistanceInput=z.infer<typeof DistanceInputSchema>;
export interface DistanceReading {meters:number|null;status:'valid'|'missing'|'outOfRange';source:'ray'|'injected'}
/** Caller stores a validated, copied scenario. This helper does not invent invalid measurements. */
export function injectedDistance(model:DistanceInput,timeMs:number,maximumMeters:number):DistanceReading{
 if(!Number.isInteger(timeMs)||timeMs<0||timeMs>120000)throw new Error('DISTANCE_TIME_RANGE');
 if(!Number.isFinite(maximumMeters)||maximumMeters<.2||maximumMeters>5)throw new Error('DISTANCE_MAX_RANGE');
 let low=0,high=model.events.length;while(low<high){const middle=(low+high)>>>1;if(model.events[middle]!.timeMs<=timeMs)low=middle+1;else high=middle;}
 const value=low===0?model.initialMeters:model.events[low-1]!.meters;
 return {meters:value===null||value>maximumMeters?null:value,status:value===null?'missing':value>maximumMeters?'outOfRange':'valid',source:'injected'};
}
