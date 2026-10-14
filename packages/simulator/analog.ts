import {z} from 'zod';
export const AnalogModelSchema=z.object({referenceVolts:z.number().positive().max(3.3,{error:'ANALOG_VOLTAGE_INCOMPATIBLE'}),bits:z.number().int().min(1).max(16),inputVolts:z.number().min(0).max(3.3,{error:'ANALOG_VOLTAGE_INCOMPATIBLE'}),noiseVolts:z.number().min(0).max(1.65).default(0),seed:z.number().int().min(0).max(4294967295).default(1),events:z.array(z.object({timeMs:z.number().int().min(0).max(119999),inputVolts:z.number().min(0).max(3.3,{error:'ANALOG_VOLTAGE_INCOMPATIBLE'})}).strict()).max(2000).default([])}).strict().superRefine((model,ctx)=>{
 const issue=(path:(string|number)[],message:string)=>ctx.addIssue({code:'custom',path,message});
 if(model.inputVolts>model.referenceVolts)issue(['inputVolts'],'ANALOG_INPUT_RANGE');
 if(model.noiseVolts>model.referenceVolts/2)issue(['noiseVolts'],'ANALOG_NOISE_RANGE');
 for(const [index,event] of model.events.entries()){
  if(event.inputVolts>model.referenceVolts)issue(['events',index,'inputVolts'],'ANALOG_INPUT_RANGE');
  if(index>0&&event.timeMs<=model.events[index-1]!.timeMs)issue(['events',index,'timeMs'],'ANALOG_EVENT_ORDER');
 }
});
export type AnalogModel=z.input<typeof AnalogModelSchema>;
/** Ideal quantization plus bounded, seeded model noise; no physical ADC calibration implied. */
export function sampleAnalog(input:AnalogModel,timeMs:number){
 const model=AnalogModelSchema.parse(input);
 if(!Number.isInteger(timeMs)||timeMs<0||timeMs>120000)throw new Error('ANALOG_TIME_RANGE');
 const sampleTime=Math.floor(timeMs/20)*20;
 let low=0,high=model.events.length;while(low<high){const middle=Math.floor((low+high)/2);if(model.events[middle]!.timeMs<=sampleTime)low=middle+1;else high=middle;}
 const voltage=low?model.events[low-1]!.inputVolts:model.inputVolts;
 let hash=(model.seed^Math.imul(sampleTime/20,0x9e3779b1))>>>0;hash=Math.imul(hash^(hash>>>16),0x85ebca6b)>>>0;hash=Math.imul(hash^(hash>>>13),0xc2b2ae35)>>>0;hash=(hash^(hash>>>16))>>>0;
 const noisy=Math.max(0,Math.min(model.referenceVolts,voltage+(hash/4294967295*2-1)*model.noiseVolts));
 const maximum=2**model.bits-1,counts=Math.round(noisy/model.referenceVolts*maximum);
 return {timeMs:sampleTime,counts,volts:counts/maximum*model.referenceVolts,maximum,referenceVolts:model.referenceVolts};
}
