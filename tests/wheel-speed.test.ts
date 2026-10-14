import {test,expect} from 'vitest';
import {speedCorrection,WheelSpeedController,WheelSpeedPlant} from '../packages/simulator/wheel-speed';
import {compareWheelSpeed,wheelSpeedTrial,wheelSpeedArtifact} from '../packages/content/wheel-speed-experiment';
import {interpret} from '../packages/simulator';
import {encoderDefaults} from '../packages/content/encoder-experiment';
test('bounded correction and final command preserve units and saturation',()=>{
 const example=speedCorrection(.18,.14,400);expect(example.correction).toBeCloseTo(16,12);expect(example.feedforward).toBe(30);expect(example.commandPercent).toBeCloseTo(46,12);expect(speedCorrection(.3,0,1000).commandPercent).toBe(60);expect(speedCorrection(.1,1,1000).commandPercent).toBe(0);
 for(const [request,measured,gain] of [[NaN,0,0],[-1,0,0],[.4,0,0],[.1,-1,0],[.1,2,0],[.1,NaN,0],[.1,0,-1],[.1,0,1001]])expect(()=>speedCorrection(request!,measured!,gain!)).toThrow('WHEEL_SPEED_CONFIG');
});
test('baseline waits for a speed sample; missing/reset feedback, stop and cadence faults latch',()=>{
 const input={timeMs:0,requestedMps:.18,measuredMps:null,feedback:'baseline' as const,stopRequested:false};
 const controller=new WheelSpeedController(400);expect(controller.tick(input)).toMatchObject({state:'waiting',commandPercent:0});expect(controller.tick({...input,timeMs:100,measuredMps:0,feedback:'valid'})).toMatchObject({state:'running'});
 for(const feedback of ['missing','reset'] as const){const c=new WheelSpeedController(400);c.tick({...input,measuredMps:0,feedback:'valid'});expect(c.tick({...input,timeMs:100,feedback})).toMatchObject({state:'fault',commandPercent:0});expect(c.tick({...input,timeMs:200,measuredMps:0,feedback:'valid'})).toMatchObject({state:'fault',commandPercent:0});}
 for(const change of [{timeMs:201},{timeMs:100,stopRequested:true},{timeMs:100,requestedMps:NaN},{timeMs:100,measuredMps:null}]){const c=new WheelSpeedController(400);c.tick({...input,measuredMps:0,feedback:'valid'});expect(c.tick({...input,measuredMps:0,feedback:'valid',...change}).state).toBe('fault');}
 const waiting=new WheelSpeedController(400);for(const timeMs of [0,100,200,300])waiting.tick({...input,timeMs});expect(waiting.tick({...input,timeMs:400}).state).toBe('fault');
 expect(new WheelSpeedController(400).tick({...input,requestedMps:0}).state).toBe('stopped');for(const timeMs of [-1,.5,NaN,120001])expect(()=>new WheelSpeedController(400).tick({...input,timeMs})).toThrow('WHEEL_SPEED_TIME');
});
test('plant exact first-order integration is consistent across time partitions',()=>{
 const one=new WheelSpeedPlant(),many=new WheelSpeedPlant();one.step(30,.55,.1);for(let i=0;i<5;i++)many.step(30,.55,.02);expect(many.speedMps).toBeCloseTo(one.speedMps,12);expect(many.travelMeters).toBeCloseTo(one.travelMeters,12);
 for(const args of [[-1,1,.02],[61,1,.02],[30,.2,.02],[30,2,.02],[30,1,0],[30,1,.2]])expect(()=>one.step(args[0]!,args[1]!,args[2]!)).toThrow('WHEEL_PLANT_INPUT');
});
test('actual quantized feedback improves loaded response but proportional-only control retains error',()=>{
 const result=compareWheelSpeed();expect(result.closedLoop.metrics.loadedMeanAbsoluteErrorMps).toBeLessThan(result.openLoop.metrics.loadedMeanAbsoluteErrorMps!);expect(result.closedLoop.metrics.loadedMeanAbsoluteErrorMps).toBeGreaterThan(.01);
 for(const trial of [result.openLoop,result.closedLoop]){expect(trial.rows).toHaveLength(81);expect(trial.rows.every(row=>row.commandPercent>=0&&row.commandPercent<=60)).toBe(true);for(const row of trial.rows.filter(row=>row.feedback==='valid'))expect(row.estimatedMps).toBeCloseTo(row.deltaCount!/360*.2/(row.sampleWindowMs!/1000),12);expect(trial.metrics.stopRequestedMs).toBe(6000);expect(trial.metrics.modelBelowOneMillimeterPerSecondMs).toBeGreaterThan(6000);}
 for(const caseId of ['feedback-loss','manual-stop'] as const){const trial=wheelSpeedTrial(400,.55,caseId);expect(trial.metrics.stopRequestedMs).toBe(3000);expect(trial.rows.filter(row=>row.timeMs>=3000).every(row=>row.commandPercent===0&&row.state==='fault')).toBe(true);}
 expect(()=>wheelSpeedTrial(400,.2)).toThrow('WHEEL_SPEED_CASE');
});
test('worksheet executes declared correction, not a hardware measurement',()=>{
 for(const [reference,expected] of [[false,30],[true,46]] as const){const events=interpret(reference?wheelSpeedArtifact.reference:wheelSpeedArtifact.starter,100);expect(events.some(event=>String(event.value).includes('NOT BOARD FEEDBACK'))).toBe(true);expect(Number(String(events.find(event=>String(event.value).includes('declared command percent='))!.value).split('=').at(-1))).toBeCloseTo(expected,10);}
});
test('alternate encoder resolution uses one configuration for count generation and conversion',()=>{
 const trial=wheelSpeedTrial(400,.55,'load-change',{...encoderDefaults,countsPerWheelRevolution:720});
 expect(trial.config.encoder.countsPerWheelRevolution).toBe(720);for(const row of trial.rows.filter(row=>row.feedback==='valid'))expect(row.estimatedMps).toBeCloseTo(row.deltaCount!/720*.2/(row.sampleWindowMs!/1000),12);
 expect(trial.rows.some(row=>row.deltaCount!>40)).toBe(true);
});
