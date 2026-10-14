import {it,expect} from 'vitest';
import {analogSeries,analogCSV} from '../packages/simulator/analog-series';
import {RobotSimulation,worlds} from '../packages/simulator';
import type {Program} from '../packages/codegen';
it('records actual expression results with explicit sample clocks and skips unchanged frames',()=>{
 const program:Program={setup:[],loop:[{kind:'set',name:'adc_time_ms',value:{kind:'sensor',sensor:'timeMs'}},{kind:'set',name:'adc_counts',value:{kind:'sensor',sensor:'analogCounts'}},{kind:'set',name:'adc_volts',value:{kind:'sensor',sensor:'analogVolts'}},{kind:'wait',ms:100}]};
 const simulation=new RobotSimulation(program,{...worlds[0]!,analog:{referenceVolts:3.3,bits:12,inputVolts:1.65}});const trace=Array.from({length:11},()=>simulation.step());const series=analogSeries(trace);expect(series.map(point=>point.timeMs)).toEqual([0,100,200]);expect(series[0]).toEqual({timeMs:0,counts:2048,volts:2048/4095*3.3});expect(analogCSV(series)).toContain('"simulation","100","2048",');
});
it('omits absent variables and rejects malformed samples or backward clocks',()=>{
 expect(analogSeries([{timeMs:0,variables:{}}])).toEqual([]);
 const base={adc_time_ms:0,adc_counts:1,adc_volts:1};
 for(const invalid of [{adc_time_ms:-1},{adc_time_ms:.5},{adc_time_ms:100},{adc_counts:-1},{adc_counts:65536},{adc_counts:.5},{adc_volts:Infinity},{adc_volts:3.4}])expect(()=>analogSeries([{timeMs:20,variables:{...base,...invalid}}])).toThrow('ANALOG_RECORDED_SAMPLE_INVALID');
 expect(()=>analogSeries([{timeMs:20,variables:{...base,adc_time_ms:20}},{timeMs:40,variables:base}])).toThrow('ANALOG_RECORDED_TIME_ORDER');expect(analogCSV([])).toBe('origin,time_ms,adc_counts,adc_volts\r\n');
 expect(()=>analogSeries([{timeMs:20,variables:base},{timeMs:40,variables:{...base,adc_counts:2}}])).toThrow('ANALOG_RECORDED_SAMPLE_CONFLICT');
});
