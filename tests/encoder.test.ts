import {test,expect} from 'vitest';
import {EncoderCounterAdapter,validateEncoderConfiguration,QuadratureEncoder} from '../packages/simulator/encoder';
import {encoderDefaults,encoderMotionExperiment,encoderArtifact,decodeEncoderSamples} from '../packages/content/encoder-experiment';
import {interpret} from '../packages/simulator';
test('unsigned adapter handles forward/reverse wrap and converts signed wheel counts',()=>{
 for(const counterBits of [16,32] as const){const modulus=2**counterBits,adapter=new EncoderCounterAdapter({...encoderDefaults,counterBits});expect(adapter.accept({timeMs:0,rawCount:modulus-2,epoch:0}).status).toBe('baseline');expect(adapter.accept({timeMs:20,rawCount:1,epoch:0})).toMatchObject({deltaCount:3,totalCount:3});expect(adapter.accept({timeMs:40,rawCount:modulus-1,epoch:0})).toMatchObject({deltaCount:-2,totalCount:1});}
 const adapter=new EncoderCounterAdapter(encoderDefaults);adapter.accept({timeMs:0,rawCount:0,epoch:0});expect(adapter.accept({timeMs:20,rawCount:180,epoch:0}).distanceSinceResetMeters).toBe(.1);expect(adapter.accept({timeMs:40,rawCount:90,epoch:0}).distanceSinceResetMeters).toBe(.05);
});
test('reset epoch establishes a new baseline rather than inventing reverse movement',()=>{
 const adapter=new EncoderCounterAdapter(encoderDefaults);adapter.accept({timeMs:0,rawCount:500,epoch:0});adapter.accept({timeMs:20,rawCount:680,epoch:0});expect(adapter.accept({timeMs:40,rawCount:0,epoch:1})).toMatchObject({status:'reset',deltaCount:0,totalCount:0,distanceSinceResetMeters:0});expect(adapter.accept({timeMs:60,rawCount:360,epoch:1}).distanceSinceResetMeters).toBe(.2);
 expect(()=>adapter.accept({timeMs:80,rawCount:10,epoch:0})).toThrow('ENCODER_ORDER');
});
test('ambiguous wrap, excessive gap and malformed snapshots reject without changing the baseline',()=>{
 const adapter=new EncoderCounterAdapter(encoderDefaults);adapter.accept({timeMs:0,rawCount:0,epoch:0});
 expect(()=>adapter.accept({timeMs:20,rawCount:32768,epoch:0})).toThrow('ENCODER_AMBIGUOUS_WRAP');expect(()=>adapter.accept({timeMs:20,rawCount:1001,epoch:0})).toThrow('ENCODER_SAMPLE_GAP');
 for(const snapshot of [{timeMs:0,rawCount:1,epoch:0},{timeMs:20,rawCount:-1,epoch:0},{timeMs:20,rawCount:65536,epoch:0},{timeMs:.5,rawCount:0,epoch:0},{timeMs:20,rawCount:0,epoch:-1},{timeMs:NaN,rawCount:0,epoch:0}])expect(()=>adapter.accept(snapshot)).toThrow();
 expect(adapter.accept({timeMs:20,rawCount:180,epoch:0}).totalCount).toBe(180);
});
test('configuration preserves decoded counts, gearing and units as explicit assumptions',()=>{
 for(const change of [{counterBits:8},{countsPerWheelRevolution:0},{countsPerWheelRevolution:1.5},{wheelCircumferenceMeters:NaN},{wheelCircumferenceMeters:0},{maximumCountsPerSample:32768}])expect(()=>validateEncoderConfiguration({...encoderDefaults,...change} as typeof encoderDefaults)).toThrow('ENCODER_CONFIG');
});
test('model counts quantize actual wheel travel including reverse while timing remains a declared alternative',()=>{
 for(const speed of [.5,.6]){const result=encoderMotionExperiment(encoderDefaults,speed),resolution=encoderDefaults.wheelCircumferenceMeters/encoderDefaults.countsPerWheelRevolution;
  expect(result.trace.at(-1)!.status).toBe('completed');expect(result.trace.every(frame=>!frame.collision)).toBe(true);expect(result.rows.some(row=>row.left.deltaCount<0)).toBe(true);
  for(const row of result.rows){expect(Math.abs(row.left.distanceSinceResetMeters-row.modeledLeftTravelMeters)).toBeLessThan(resolution+1e-12);expect(row.left.totalCount).toBe(row.right.totalCount);}
  expect(result.rows.at(-1)!.modeledLeftTravelMeters).toBeCloseTo(result.trace.at(-1)!.pose.x-result.world.start.x,10);expect(result.noEncoderAlternative.origin).toBe('nominal-timing-estimate');
 }
 const slow=encoderMotionExperiment(encoderDefaults,.5);expect(Math.abs(slow.rows.at(-1)!.modeledLeftTravelMeters-slow.noEncoderAlternative.distanceMeters)).toBeGreaterThan(.01);
 expect(()=>encoderMotionExperiment(encoderDefaults,NaN)).toThrow('ENCODER_PLANT');
});
test('runnable count worksheet preserves declared origin and exposes the incorrect starter scale',()=>{
 const reference=interpret(encoderArtifact.reference,100),starter=interpret(encoderArtifact.starter,100),printed=reference.filter(event=>event.kind==='print');expect(printed.every(event=>String(event.value).startsWith('declared distance m='))).toBe(true);expect(printed.map(event=>Number(String(event.value).split('=').at(-1)))).toEqual([.1,.2,-.05]);expect(starter).not.toEqual(reference);
});
test('quadrature decodes both directions, rejects skipped states and explicitly resets its fault',()=>{
 const decoder=new QuadratureEncoder();const states=[[false,false],[false,true],[true,true],[true,false],[false,false]] as const;
 expect(states.map(([a,b],index)=>decoder.edge(index*100,a,b).deltaCount)).toEqual([0,1,1,1,1]);
 expect(decoder.edge(500,true,false)).toMatchObject({deltaCount:-1,rawCount:3});
 expect(()=>decoder.edge(600,false,true)).toThrow('ENCODER_QUADRATURE_TRANSITION');expect(()=>decoder.edge(700,false,false)).toThrow('ENCODER_QUADRATURE_FAULT');
 expect(decoder.reset(800,false,false)).toMatchObject({rawCount:0,epoch:1});expect(decoder.edge(900,false,true).rawCount).toBe(1);expect(decoder.edge(1000,false,true).deltaCount).toBe(0);
 for(const timeUs of [1000,-1,.5,NaN,120000001])expect(()=>decoder.edge(timeUs,false,false)).toThrow('ENCODER_EDGE');expect(()=>new QuadratureEncoder(8 as 16)).toThrow('ENCODER_BITS');
});
test('learner-entered count tables preserve origin and show reset, reverse and malformed data',()=>{
 const result=decodeEncoderSamples('0, 0, 0\n20, 65535, 0\n40, 0, 1\n60, 180, 1');expect(result.origin).toBe('learner-entered-counts');expect(result.rows[1]!.deltaCount).toBe(-1);expect(result.rows[2]!.status).toBe('reset');expect(result.rows[3]!.distanceSinceResetMeters).toBe(.1);
 for(const text of ['', '0,0,0','0,0,0\n20,,0','0,0,0\n20,NaN,0','0,0,0\n20,1e2,0',Array(101).fill('0,0,0').join('\n')])expect(()=>decodeEncoderSamples(text)).toThrow('ENCODER_TEXT');
});
test('quadrature output composes with unsigned count adapter and wraps in both widths',()=>{
 for(const counterBits of [16,32] as const){
  const quadrature=new QuadratureEncoder(counterBits),adapter=new EncoderCounterAdapter({...encoderDefaults,counterBits});
  const baseline=quadrature.edge(0,false,false);adapter.accept({timeMs:0,rawCount:baseline.rawCount,epoch:baseline.epoch});
  const reverse=quadrature.edge(20000,true,false);expect(reverse.rawCount).toBe(2**counterBits-1);expect(adapter.accept({timeMs:20,rawCount:reverse.rawCount,epoch:reverse.epoch}).deltaCount).toBe(-1);
  const forward=quadrature.edge(40000,false,false);expect(forward.rawCount).toBe(0);expect(adapter.accept({timeMs:40,rawCount:forward.rawCount,epoch:forward.epoch}).totalCount).toBe(0);
 }
});
