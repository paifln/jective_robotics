import {it,expect} from 'vitest';
import {summarizeMeasurements,describeEnteredMeasurements,runSensorUncertainty} from '../packages/content/sensor-uncertainty';
it('describes spread and signed mean error without replacing unavailable readings with zero',()=>{
 expect(summarizeMeasurements({referenceMeters:1,readings:[.9,1.1,null]})).toEqual({count:3,validCount:2,missingCount:1,minimum:.9,maximum:1.1,mean:1,span:1.1-.9,meanError:0});
 expect(summarizeMeasurements({referenceMeters:1,readings:[null]})).toMatchObject({validCount:0,missingCount:1,mean:null,span:null,meanError:null});
 expect(summarizeMeasurements({referenceMeters:1,readings:[1.2]}).meanError).toBeCloseTo(.2);
 for(const readings of [[],[NaN],[Infinity],[-1],[6],Array(301).fill(1)])expect(()=>summarizeMeasurements({referenceMeters:1,readings})).toThrow();
 expect(()=>summarizeMeasurements({referenceMeters:1,readings:[1],units:'cm'})).toThrow();
});
it('uses the actual stationary simulator and reproduces seeded noise while keeping physical evidence separate',()=>{
 const inputs={seed:23,samples:100,noiseMeters:.05},report=runSensorUncertainty(inputs);expect(report).toEqual(runSensorUncertainty(inputs));expect(report.summary.span).toBeGreaterThan(0);expect(report.readings.every(n=>n!==null&&n>=1.449&&n<=1.551)).toBe(true);
 expect(report.trace.every(state=>state.pose.x===report.world.start.x&&state.pose.y===report.world.start.y&&!state.collision)).toBe(true);expect(report.trace.at(-1)!.timeMs).toBe(2000);
 const zero=runSensorUncertainty({...inputs,noiseMeters:0});expect(zero.summary.span).toBe(0);expect(zero.summary.mean).toBe(1.5);expect(runSensorUncertainty({...inputs,seed:24}).readings).not.toEqual(report.readings);
 const entered=describeEnteredMeasurements({referenceMeters:1.5,readings:[1.7,null,1.6]});expect(entered.origin).toBe('learner-entered');expect(entered.physicalVerification).toBe('NOT RUN');expect(entered.summary.meanError).toBeCloseTo(.15);expect(report.physicalVerification).toBe('NOT RUN');
 expect(()=>runSensorUncertainty({...inputs,samples:100000})).toThrow();
});
