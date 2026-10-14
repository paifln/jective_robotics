import {it,expect} from 'vitest';
import {runRepeatableExperiment,repeatablePrograms} from '../packages/content/repeatable-experiment';
const inputs={seed:23,comparisonSeed:24,steps:200,noiseMeters:.05};
it('replays actual seeded fixed-step traces and fairly compares two thresholds in the same world',()=>{
 const report=runRepeatableExperiment(inputs);expect(report.origin).toBe('block-simulation');expect(report.fixedStepMs).toBe(20);expect(report.units).toEqual({position:'m',heading:'rad',time:'ms',noise:'m'});for(const run of Object.values(report.runs)){expect(run.sameSeedMatches).toBe(true);expect(run.first).toEqual(run.repeat);expect(run.changedSeedDiffers).toBe(true);expect(run.first).not.toEqual(run.changedSeed);expect(run.first.map(s=>s.timeMs)).toEqual(Array.from({length:200},(_,i)=>(i+1)*20));expect(run.first.some(s=>s.collision)).toBe(false);}expect(report.runs.early.first.at(-1)!.pose.x).toBeLessThan(report.runs.near.first.at(-1)!.pose.x);expect(report.programs).toEqual(repeatablePrograms);expect(report.physicalVerification).toBe('NOT RUN');
});
it('reports unchanged controls honestly when seeds are equal or noise is zero',()=>{
 for(const value of [{...inputs,comparisonSeed:23},{...inputs,noiseMeters:0}])for(const run of Object.values(runRepeatableExperiment(value).runs)){expect(run.sameSeedMatches).toBe(true);expect(run.changedSeedDiffers).toBe(false);expect(run.changedSeed).toEqual(run.first);}
});
it('bounds work and unsigned seeds, rejects nonfinite inputs and keeps exported program snapshots independent',()=>{
 for(const value of [{...inputs,steps:0},{...inputs,steps:301},{...inputs,steps:1.5},{...inputs,seed:-1},{...inputs,seed:0x100000000},{...inputs,comparisonSeed:NaN},{...inputs,noiseMeters:.201},{...inputs,noiseMeters:Infinity},{...inputs,extra:true}])expect(()=>runRepeatableExperiment(value)).toThrow();const report=runRepeatableExperiment({...inputs,seed:0xffffffff,comparisonSeed:0,steps:1});expect(report.runs.near.first).toHaveLength(1);report.programs.near.loop.length=0;expect(repeatablePrograms.near.loop).toHaveLength(2);expect(inputs).toEqual({seed:23,comparisonSeed:24,steps:200,noiseMeters:.05});
});
