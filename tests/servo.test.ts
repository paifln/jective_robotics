import {test,expect} from 'vitest';
import {ServoLinkageModel,ServoSweepController,validateServoEnvelope} from '../packages/simulator/servo';
import {servoTrial,servoModelDefaults,servoArtifact} from '../packages/content/servo-experiment';
import {interpret} from '../packages/simulator';
const input=(timeMs:number)=>({timeMs,measuredDegrees:90,requestDegrees:null as number|null,stopRequested:false,blocked:false});
test('mechanism envelope and explicit model clearance reject invalid configurations',()=>{
 for(const change of [{minimumDegrees:-1},{minimumDegrees:90},{maximumDegrees:90},{maximumDegrees:181},{neutralDegrees:NaN}])expect(()=>validateServoEnvelope({...servoModelDefaults,...change})).toThrow('SERVO_ENVELOPE');
 for(const change of [{hardMinimumDegrees:60},{hardMaximumDegrees:120},{degreesPerSecond:29},{degreesPerSecond:181},{hardMinimumDegrees:NaN},{hardMaximumDegrees:181}])expect(()=>new ServoLinkageModel({...servoModelDefaults,...change})).toThrow('SERVO_MODEL_CONFIG');
 const config={...servoModelDefaults},model=new ServoLinkageModel(config);config.degreesPerSecond=180;expect(model.configuration.degreesPerSecond).toBe(90);
});
test('limited sweep stays inside declared limits and releases rather than holding indefinitely',()=>{
 const trial=servoTrial();expect(trial.rows).toHaveLength(201);expect(trial.metrics.faultTimeMs).toBeNull();expect(trial.metrics.releaseTimesMs).toHaveLength(3);expect(trial.metrics.minimumObservedDegrees).toBe(60);expect(trial.metrics.maximumObservedDegrees).toBe(120);expect(trial.rows.at(-1)).toMatchObject({state:'released',signalEnabled:false,modelAngleDegrees:90});
 for(const release of trial.metrics.releaseTimesMs){const arrived=trial.rows.find(row=>row.timeMs<release&&row.timeMs>=release-280&&row.state==='holding')!;expect(release-arrived.timeMs).toBeLessThanOrEqual(280);}
});
test('absent unsupported and injected failures latch release without recovery restart',()=>{
 for(const caseId of ['absent','unsupported','feedback-loss','obstruction','manual-stop','invalid-target'] as const){const trial=servoTrial(servoModelDefaults,caseId);expect(trial.metrics.faultTimeMs).not.toBeNull();expect(trial.rows.filter(row=>row.timeMs>=trial.metrics.faultTimeMs!).every(row=>row.state==='fault'&&!row.signalEnabled&&row.targetDegrees===null)).toBe(true);if(caseId==='absent'||caseId==='unsupported'||caseId==='invalid-target')expect(trial.rows.every(row=>row.modelAngleDegrees===90)).toBe(true);if(caseId==='obstruction')expect(trial.metrics.maximumObservedDegrees).toBe(100);}
 const lost=servoTrial(servoModelDefaults,'feedback-loss');expect(lost.rows.find(row=>row.timeMs===600)!.measuredDegrees).toBeNull();expect(lost.rows.find(row=>row.timeMs===1000)).toMatchObject({state:'fault',signalEnabled:false,measuredDegrees:60});
});
test('busy target timeout cadence and invalid feedback faults remain disabled',()=>{
 const c=new ServoSweepController(servoModelDefaults,'model');expect(c.tick({...input(0),requestDegrees:60}).state).toBe('moving');expect(c.tick({...input(20),requestDegrees:120}).fault).toBe('SERVO_BUSY');
 const timeout=new ServoSweepController(servoModelDefaults,'model');timeout.tick({...input(0),requestDegrees:60});for(let t=100;t<1500;t+=100)timeout.tick(input(t));expect(timeout.tick(input(1500))).toMatchObject({fault:'SERVO_TIMEOUT',signalEnabled:false});
 for(const change of [{timeMs:101},{measuredDegrees:null},{measuredDegrees:NaN},{measuredDegrees:181},{measuredDegrees:-1},{measuredDegrees:50},{measuredDegrees:130},{requestDegrees:NaN}]){const ctrl=new ServoSweepController(servoModelDefaults,'model');ctrl.tick(input(0));expect(ctrl.tick({...input(20),...change}).state).toBe('fault');}
 for(const timeMs of [-1,NaN,.5,120001])expect(()=>new ServoSweepController(servoModelDefaults,'model').tick(input(timeMs))).toThrow('SERVO_TIME');expect(()=>new ServoSweepController(servoModelDefaults,'unknown' as 'model')).toThrow('SERVO_AVAILABILITY');
});
test('released model does not invent holding effort; obstruction and hard stops report blockage',()=>{
 const model=new ServoLinkageModel(servoModelDefaults);expect(model.step(120,false)).toEqual({blocked:false,simulatedEffort:false});expect(model.angleDegrees).toBe(90);model.step(120,true,.1,95);expect(model.angleDegrees).toBe(95);expect(model.step(120,true,.1,95).blocked).toBe(true);for(let i=0;i<10;i++)model.step(180,true,.1);expect(model.angleDegrees).toBe(135);expect(model.step(180,true,.1).blocked).toBe(true);
 for(const [target,enabled,dt,obstruction] of [[NaN,true,.02,null],[120,true,0,null],[120,true,.2,null],[120,true,.02,200]] as const)expect(()=>model.step(target,enabled,dt,obstruction)).toThrow('SERVO_MODEL_INPUT');
});
test('ordinary worker artifact only checks declared angles and does not claim actuator execution',()=>{
 for(const reference of [false,true]){const events=interpret(reference?servoArtifact.reference:servoArtifact.starter,100);expect(events.some(event=>String(event.value).includes('NO SERVO DRIVER'))).toBe(true);expect(events.some(event=>String(event.value).includes(reference?'WITHIN ENVELOPE':'REJECTED'))).toBe(true);}
});
