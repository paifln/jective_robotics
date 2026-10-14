import {it,expect} from 'vitest';
import {AnalogModelSchema,sampleAnalog} from '../packages/simulator/analog';
import {RobotSimulation,WorldSchema,worlds} from '../packages/simulator';
import {generate,type Program} from '../packages/codegen';
it('ideal analog quantization covers endpoints, resolution and timestamped input changes',()=>{
 const model={referenceVolts:3.3,bits:12,inputVolts:0,events:[{timeMs:20,inputVolts:1.65},{timeMs:41,inputVolts:3.3}]};
 expect(sampleAnalog(model,0).counts).toBe(0);expect(sampleAnalog(model,20).counts).toBe(2048);expect(sampleAnalog(model,39)).toEqual(sampleAnalog(model,20));expect(sampleAnalog(model,40).counts).toBe(2048);expect(sampleAnalog(model,60).counts).toBe(4095);expect(sampleAnalog(model,60).volts).toBe(3.3);
 for(const bits of [1,8,16])expect(sampleAnalog({referenceVolts:1,bits,inputVolts:1},0).counts).toBe(2**bits-1);
});
it('model noise is bounded, seeded, clipped and stable within one sampling tick',()=>{
 const model={referenceVolts:3.3,bits:12,inputVolts:1.65,noiseVolts:.1,seed:42};const series=Array.from({length:100},(_,index)=>sampleAnalog(model,index*20));
 expect(new Set(series.map(s=>s.counts)).size).toBeGreaterThan(30);for(const sample of series)expect(Math.abs(sample.volts-1.65)).toBeLessThanOrEqual(.1+3.3/4095/2);
 for(let repeat=0;repeat<10;repeat++)expect(Array.from({length:100},(_,index)=>sampleAnalog(model,index*20))).toEqual(series);
 expect(sampleAnalog(model,21)).toEqual(sampleAnalog(model,20));expect(sampleAnalog({...model,seed:43},0)).not.toEqual(sampleAnalog(model,0));
 for(const inputVolts of [0,3.3])for(let time=0;time<1000;time+=20){const sample=sampleAnalog({...model,inputVolts},time);expect(sample.counts).toBeGreaterThanOrEqual(0);expect(sample.counts).toBeLessThanOrEqual(4095);}
});
it('rejects incompatible voltages, malformed event models and invalid sampling times',()=>{
 const base={referenceVolts:3.3,bits:12,inputVolts:1};
 for(const invalid of [{referenceVolts:5},{inputVolts:5},{referenceVolts:1,inputVolts:2},{referenceVolts:1,noiseVolts:.6},{bits:0},{bits:17},{events:[{timeMs:0,inputVolts:5}]},{referenceVolts:1,events:[{timeMs:0,inputVolts:2}]},{events:[{timeMs:20,inputVolts:1},{timeMs:0,inputVolts:1}]},{events:[{timeMs:0,inputVolts:1},{timeMs:0,inputVolts:1}]},{events:Array.from({length:2001},(_,timeMs)=>({timeMs,inputVolts:1}))}])expect(AnalogModelSchema.safeParse({...base,...invalid}).success).toBe(false);
 for(const time of [-1,.5,Infinity,120001])expect(()=>sampleAnalog(base,time)).toThrow('ANALOG_TIME_RANGE');
 expect(()=>sampleAnalog({...base,inputVolts:5},0)).toThrow('ANALOG_VOLTAGE_INCOMPATIBLE');
});
it('robot expressions share one quantized sample and require explicit model configuration',()=>{
 const program:Program={setup:[{kind:'set',name:'adc_counts',value:{kind:'sensor',sensor:'analogCounts'}},{kind:'set',name:'adc_volts',value:{kind:'sensor',sensor:'analogVolts'}}],loop:[]};
 const analog={referenceVolts:3.3,bits:12,inputVolts:1.65,noiseVolts:.1,seed:42},world=WorldSchema.parse({...worlds[0]!,analog});const state=new RobotSimulation(program,world).step();expect(state.variables.adc_counts).toBe(sampleAnalog(analog,0).counts);expect(state.variables.adc_volts).toBe(state.variables.adc_counts!/4095*3.3);
 expect(new RobotSimulation(program,worlds[0]!).step().error).toContain('ANALOG_MODEL_REQUIRED');expect(()=>generate(program,2)).toThrow('SENSOR_DRIVER_REQUIRED');
});
