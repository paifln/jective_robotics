import {test,expect} from 'vitest';
import {WheelPidController,validatePidConfiguration} from '../packages/simulator/pid';
import {WheelSpeedController,type SpeedInput} from '../packages/simulator/wheel-speed';
import {runWheelBench} from '../packages/simulator/wheel-bench';
import {encoderDefaults} from '../packages/content/encoder-experiment';
import {wheelSpeedTrial} from '../packages/content/wheel-speed-experiment';
import {comparePid,pidTrial,pidArtifact} from '../packages/content/pid-experiment';
import {interpret} from '../packages/simulator';
const sample=(timeMs:number,measuredMps:number|null=0):SpeedInput=>({timeMs,requestedMps:.18,measuredMps,feedback:'valid',stopRequested:false});
test('PID configuration and clock reject non-finite, out-of-range and repeated input',()=>{
 for(const config of [{kp:NaN,ki:0,kd:0},{kp:-1,ki:0,kd:0},{kp:1001,ki:0,kd:0},{kp:0,ki:Infinity,kd:0},{kp:0,ki:-1,kd:0},{kp:0,ki:1001,kd:0},{kp:0,ki:0,kd:-1},{kp:0,ki:0,kd:101},{kp:0,ki:0,kd:NaN}])expect(()=>validatePidConfiguration(config)).toThrow('PID_CONFIG');
 expect(()=>new WheelPidController({kp:0,ki:0,kd:0},null as unknown as boolean)).toThrow('PID_PROTECTION_CONFIG');
 const c=new WheelPidController({kp:400,ki:300,kd:10});c.tick(sample(0));expect(()=>c.tick(sample(0))).toThrow('WHEEL_SPEED_TIME');
});
test('zero I/D reproduces the P response through the same quantized plant',()=>{
 for(const caseId of ['load-change','feedback-loss','manual-stop'] as const){
  const old=wheelSpeedTrial(400,.55,caseId),pid=pidTrial({kp:400,ki:0,kd:0},.55,caseId);
  expect(pid.config).toEqual(old.config);expect(pid.metrics.loadedMeanAbsoluteErrorMps).toBe(old.metrics.loadedMeanAbsoluteErrorMps);
  expect(pid.rows.map(row=>[row.modelSpeedMps,row.estimatedMps,row.commandPercent,row.state])).toEqual(old.rows.map(row=>[row.modelSpeedMps,row.estimatedMps,row.commandPercent,row.state]));
  const bench=runWheelBench(new WheelSpeedController(400),.55,caseId,encoderDefaults);expect(bench.rows.map(row=>row.commandPercent)).toEqual(old.rows.map(row=>row.commandPercent));
 }
});
test('conditional integration freezes saturation but permits integral unwinding',()=>{
 const protectedController=new WheelPidController({kp:400,ki:300,kd:0}),clampOnly=new WheelPidController({kp:400,ki:300,kd:0},false);
 for(let t=0;t<=1000;t+=100){const a=protectedController.tick(sample(t)),b=clampOnly.tick(sample(t));expect(a.commandPercent).toBe(60);expect(a.terms?.integral).toBe(0);expect(a.terms?.antiWindupBlocked).toBe(true);expect(b.terms!.integral).toBeLessThanOrEqual(30);}
 const unwinding=clampOnly.tick(sample(1100,.2));expect(unwinding.terms!.integral).toBeCloseTo(29.4,12);
 const c=new WheelPidController({kp:0,ki:300,kd:0});for(let t=0;t<=1000;t+=100)c.tick(sample(t,.16));const prior=c.tick(sample(1100,.16)).terms!.integral;
 const released=c.tick(sample(1200,.2));expect(released.terms!.integral).toBeLessThan(prior);expect(released.terms!.antiWindupBlocked).toBe(false);
 const lower=new WheelPidController({kp:400,ki:300,kd:0});lower.tick(sample(0,1));expect(lower.tick(sample(100,1))).toMatchObject({commandPercent:0,terms:{integral:0,antiWindupBlocked:true}});
});
test('derivative uses filtered measurement without setpoint kick',()=>{
 const c=new WheelPidController({kp:0,ki:0,kd:10});expect(c.tick(sample(0,.1)).terms!.d).toBeCloseTo(0,12);
 expect(c.tick({...sample(100,.1),requestedMps:.25}).terms!.d).toBeCloseTo(0,12);
 const change=c.tick(sample(200,.2));expect(change.terms!.filteredDerivative).toBeCloseTo(.5,12);expect(change.terms!.d).toBeCloseTo(-5,12);
 expect(c.tick(sample(300,.2)).terms!.d).toBeCloseTo(-2.5,12);
});
test('baseline is unknown, valid zero starts, and terminal states clear memory and latch',()=>{
 for(const change of [{feedback:'missing' as const,measuredMps:null},{feedback:'reset' as const},{stopRequested:true},{requestedMps:0},{timeMs:401}]){
  const c=new WheelPidController({kp:10,ki:300,kd:10});expect(c.tick({...sample(0,null),feedback:'baseline'})).toMatchObject({state:'waiting',commandPercent:0,terms:null});
  expect(c.tick(sample(100,0)).state).toBe('running');expect(c.tick(sample(200,.1)).terms!.integral).toBeGreaterThan(0);
  const fault=c.tick({...sample(300),...change});expect(fault.commandPercent).toBe(0);expect(fault.terms).toBeNull();expect(c.tick(sample(500)).commandPercent).toBe(0);
 }
 const waiting=new WheelPidController({kp:0,ki:0,kd:0});for(let t=0;t<=300;t+=100)expect(waiting.tick({...sample(t,null),feedback:'baseline'}).state).toBe('waiting');expect(waiting.tick({...sample(400,null),feedback:'baseline'}).state).toBe('fault');
});
test('controlled comparisons export actual bounded responses and fault traces',()=>{
 const comparison=comparePid();for(const trial of [comparison.p,comparison.pi,comparison.pid]){
  expect(trial.rows).toHaveLength(81);expect(trial.rows.every(row=>row.commandPercent>=0&&row.commandPercent<=60)).toBe(true);
  expect(trial.rows.every(row=>!row.terms||Math.abs(row.terms.integral)<=30)).toBe(true);expect(trial.physicalVerification).toBe('NOT RUN');
 }
 expect(comparison.pi.metrics.loadedMeanAbsoluteErrorMps).toBeLessThan(comparison.p.metrics.loadedMeanAbsoluteErrorMps!);
 for(const caseId of ['feedback-loss','manual-stop'] as const){const trial=pidTrial({kp:400,ki:300,kd:10},.55,caseId);expect(trial.rows.filter(row=>row.timeMs>=3000).every(row=>row.state==='fault'&&row.commandPercent===0&&row.terms===null)).toBe(true);}
 const protectedTrial=pidTrial({kp:400,ki:300,kd:10},.3),clampOnly=pidTrial({kp:400,ki:300,kd:10},.3,'load-change',encoderDefaults,false);
 expect(protectedTrial.metrics.blockedIntegrationSamples).toBeGreaterThan(0);expect(clampOnly.metrics.blockedIntegrationSamples).toBe(0);
 expect(protectedTrial.rows).not.toEqual(clampOnly.rows);
});
test('declared arithmetic worksheet executes one integral update without hardware claims',()=>{
 for(const reference of [false,true]){const events=interpret(reference?pidArtifact.reference:pidArtifact.starter,100);expect(events.some(event=>String(event.value).includes('NOT BOARD FEEDBACK'))).toBe(true);const command=events.find(event=>String(event.value).includes('declared command percent='));expect(Number(String(command!.value).split('=').at(-1))).toBeCloseTo(reference?47.2:46,10);}
});
