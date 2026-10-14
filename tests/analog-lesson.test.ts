import {it,expect} from 'vitest';
import {analogArtifact} from '../packages/content/lesson-analog';
import {RobotSimulation,WorldSchema} from '../packages/simulator';
import {analogSeries} from '../packages/simulator/analog-series';
import {generate} from '../packages/codegen';
it('L14 rejects mislabeled starter values and records one hundred correctly timed reference samples',()=>{
 const starter=new RobotSimulation(analogArtifact.starter,analogArtifact.world!).step();expect(()=>analogSeries([starter])).toThrow('ANALOG_RECORDED_SAMPLE_INVALID');
 const simulation=new RobotSimulation(analogArtifact.reference,analogArtifact.world!);const trace=Array.from({length:101},()=>simulation.step());const series=analogSeries(trace);expect(series).toHaveLength(100);expect(series.map(p=>p.timeMs)).toEqual(Array.from({length:100},(_,index)=>index*20));expect(trace.at(-1)!.status).toBe('completed');
 for(const point of series){const expected=point.timeMs<1000?1:2;expect(Math.abs(point.volts-expected)).toBeLessThanOrEqual(.02+3.3/4095/2);expect(point.volts).toBe(point.counts/4095*3.3);}
 expect(()=>generate(analogArtifact.reference,2)).toThrow('SENSOR_DRIVER_REQUIRED');
});
it('L14 noise-free and eight-bit comparisons preserve unit conversion and reject voltage assumptions',()=>{
 const world=analogArtifact.world!;
 for(const bits of [8,12]){
  const simulation=new RobotSimulation(analogArtifact.reference,{...world,analog:{...world.analog!,bits,noiseVolts:0}});const series=analogSeries(Array.from({length:101},()=>simulation.step()));expect(new Set(series.slice(0,50).map(p=>p.counts)).size).toBe(1);expect(new Set(series.slice(50).map(p=>p.counts)).size).toBe(1);expect(series[0]!.counts).toBe(Math.round((2**bits-1)/3.3));expect(series[50]!.counts).toBe(Math.round(2*(2**bits-1)/3.3));
 }
 expect(WorldSchema.safeParse({...world,analog:{...world.analog!,inputVolts:5}}).success).toBe(false);expect(WorldSchema.safeParse({...world,analog:{...world.analog!,referenceVolts:1,inputVolts:2}}).success).toBe(false);
});
