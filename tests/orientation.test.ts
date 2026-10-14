import {test,expect} from 'vitest';
import {wrapHeadingDegrees,calibrateGyroBias,GyroHeadingEstimator} from '../packages/simulator/orientation';
import {orientationTrial,orientationArtifact} from '../packages/content/orientation-experiment';
import {interpret} from '../packages/simulator';
test('heading wrapping preserves shortest signed angular difference across the branch cut',()=>{
 expect(wrapHeadingDegrees(180)).toBe(-180);expect(wrapHeadingDegrees(350)).toBe(-10);expect(wrapHeadingDegrees(-190)).toBe(170);expect(wrapHeadingDegrees(-179-179)).toBe(2);expect(()=>wrapHeadingDegrees(NaN)).toThrow('HEADING_INVALID');
});
test('bias calibration requires enough finite explicitly stationary samples without pretending to detect constant rotation',()=>{
 const result=calibrateGyroBias(Array.from({length:20},(_,i)=>i%2?3:1),true);expect(result.biasDegreesPerSecond).toBe(2);expect(result.standardDeviationDegreesPerSecond).toBe(1);expect(result.assumption).toContain('constant rotation');
 expect(()=>calibrateGyroBias(Array(20).fill(2),false)).toThrow('GYRO_STATIONARY_REQUIRED');for(const values of [[],Array(201).fill(0),Array(10).fill(NaN),Array(10).fill(501)])expect(()=>calibrateGyroBias(values,true)).toThrow('GYRO_CALIBRATION_SAMPLES');
});
test('integration uses actual seconds, baseline does not integrate, and faults cannot invent recovered orientation',()=>{
 const estimator=new GyroHeadingEstimator(170,2);expect(estimator.accept(0,47)).toMatchObject({state:'baseline',headingDegrees:170});expect(estimator.accept(200,47).headingDegrees).toBeCloseTo(179,12);expect(estimator.accept(300,47).headingDegrees).toBeCloseTo(-176.5,12);expect(estimator.accept(400,null)).toMatchObject({state:'fault',headingDegrees:null});expect(estimator.accept(500,0).headingDegrees).toBeNull();
 expect(()=>estimator.accept(500,0)).toThrow('GYRO_TIME');for(const time of [-1,.5,120001,NaN])expect(()=>new GyroHeadingEstimator(0,0).accept(time,0)).toThrow('GYRO_TIME');expect(()=>new GyroHeadingEstimator(0,NaN)).toThrow('GYRO_BIAS');
 for(const sample of [[201,0],[100,NaN],[100,501]] as const){const c=new GyroHeadingEstimator(0,0);c.accept(0,0);expect(c.accept(sample[0],sample[1]).state).toBe('fault');}
});
test('independent analytical endpoint proves drift and bias removal while model truth remains distinct',()=>{
 const report=orientationTrial(2,0);expect(report.rows).toHaveLength(81);expect(report.calibration?.biasDegreesPerSecond).toBe(2);const final=report.rows.at(-1)!;expect(final.truthHeadingDegrees).toBe(-10);expect(final.uncalibratedErrorDegrees).toBeCloseTo(16,10);expect(final.calibratedErrorDegrees).toBeCloseTo(0,10);
 const noisy=orientationTrial(2,3);expect(noisy.rows.some(row=>row.simulatedRateDegreesPerSecond!==row.trueRateDegreesPerSecond)).toBe(true);expect(noisy.rows.some(row=>Math.abs(row.calibratedErrorDegrees!)>.1)).toBe(true);expect(noisy.configuration.initialHeadingDegrees).toBe(170);expect(noisy.physicalVerification).toBe('NOT RUN');
});
test('missing signals remain null and moving calibration is rejected rather than relabeled stationary',()=>{
 const missing=orientationTrial(2,1,'missing-signal');expect(missing.rows.find(row=>row.timeMs===4200)!.simulatedRateDegreesPerSecond).toBeNull();expect(missing.rows.filter(row=>row.timeMs>=4000).every(row=>row.calibratedHeadingDegrees===null&&row.uncalibratedHeadingDegrees===null)).toBe(true);const moving=orientationTrial(2,1,'moving-calibration');expect(moving.calibrationFault).toBe('GYRO_STATIONARY_REQUIRED');expect(moving.rows.every(row=>row.calibratedState==='calibration-rejected')).toBe(true);
 for(const [bias,noise] of [[6,1],[NaN,1],[2,-1],[2,6]])expect(()=>orientationTrial(bias!,noise!)).toThrow('ORIENTATION_CONFIG');
});
test('declared worksheet computes drift only and explicitly excludes an IMU driver',()=>{
 for(const reference of [false,true]){const events=interpret(reference?orientationArtifact.reference:orientationArtifact.starter,100);expect(events.some(event=>String(event.value).includes('NO IMU DRIVER'))).toBe(true);const line=events.find(event=>String(event.value).includes('declared drift degrees='));expect(Number(String(line!.value).split('=').at(-1))).toBe(reference?0:16);}
});
