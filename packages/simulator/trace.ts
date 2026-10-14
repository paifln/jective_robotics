import {z} from 'zod';
export const TraceEventSchema=z.object({timeMs:z.number().int().min(0).max(3600000),kind:z.enum(['led','print','pwm','sound','soundStop']),value:z.union([z.boolean(),z.string().max(1000),z.number()]),channel:z.union([z.literal(1),z.literal(2)]).optional(),durationMs:z.number().int().min(1).max(60000).optional()}).strict().refine(event=>{
 if(event.kind!=='sound'&&event.durationMs!==undefined)return false;
 if(event.kind!=='led'&&event.kind!=='pwm'&&event.channel!==undefined)return false;
 if(event.kind==='led')return typeof event.value==='boolean';
 if(event.kind==='print')return typeof event.value==='string';
 if(event.kind==='pwm')return typeof event.value==='number'&&event.value>=0&&event.value<=100;
 if(event.kind==='sound')return typeof event.value==='number'&&Number.isInteger(event.value)&&event.value>=20&&event.value<=20000&&event.durationMs!==undefined;
 return event.value===0;
},'SIM_TRACE_EVENT_INVALID');
