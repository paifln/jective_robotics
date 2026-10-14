export interface EncoderConfiguration {counterBits:16|32;countsPerWheelRevolution:number;wheelCircumferenceMeters:number;maximumCountsPerSample:number}
export interface EncoderSnapshot {timeMs:number;rawCount:number;epoch:number}
export function validateEncoderConfiguration(config:EncoderConfiguration){
 const half=2**(config.counterBits-1);
 if(![16,32].includes(config.counterBits)||!Number.isInteger(config.countsPerWheelRevolution)||config.countsPerWheelRevolution<1||config.countsPerWheelRevolution>1000000||!Number.isFinite(config.wheelCircumferenceMeters)||config.wheelCircumferenceMeters<.01||config.wheelCircumferenceMeters>2||!Number.isInteger(config.maximumCountsPerSample)||config.maximumCountsPerSample<1||config.maximumCountsPerSample>=half)throw new Error('ENCODER_CONFIG');
 return {...config};
}
/** Transport-neutral unsigned counter adapter. Epoch identifies an explicitly declared reset. */
export class EncoderCounterAdapter {
 private readonly config:EncoderConfiguration;private previous:EncoderSnapshot|null=null;private total=0;
 constructor(config:EncoderConfiguration){this.config=validateEncoderConfiguration(config);}
 accept(snapshot:EncoderSnapshot){
  const modulus=2**this.config.counterBits;
  if(!Number.isInteger(snapshot.timeMs)||snapshot.timeMs<0||snapshot.timeMs>120000||!Number.isInteger(snapshot.rawCount)||snapshot.rawCount<0||snapshot.rawCount>=modulus||!Number.isInteger(snapshot.epoch)||snapshot.epoch<0||snapshot.epoch>2147483647)throw new Error('ENCODER_SNAPSHOT');
  if(this.previous&&(snapshot.timeMs<=this.previous.timeMs||snapshot.epoch<this.previous.epoch))throw new Error('ENCODER_ORDER');
  let delta=0,status:'baseline'|'reset'|'count'='baseline',total=this.total;
  if(this.previous&&snapshot.epoch===this.previous.epoch){
   delta=(snapshot.rawCount-this.previous.rawCount+modulus)%modulus;
   if(delta===modulus/2)throw new Error('ENCODER_AMBIGUOUS_WRAP');
   if(delta>modulus/2)delta-=modulus;
   if(Math.abs(delta)>this.config.maximumCountsPerSample)throw new Error('ENCODER_SAMPLE_GAP');
   total+=delta;status='count';
  }else if(this.previous){status='reset';total=0;}
  if(!Number.isSafeInteger(total))throw new Error('ENCODER_TOTAL_RANGE');
  this.previous={...snapshot};this.total=total;
  return {...snapshot,status,deltaCount:delta,totalCount:total,distanceSinceResetMeters:total/this.config.countsPerWheelRevolution*this.config.wheelCircumferenceMeters};
 }
}
/** x4 quadrature convention: 00 → 01 → 11 → 10 → 00 is positive. */
export class QuadratureEncoder {
 private state:number|null=null;private last=-1;private raw=0;private epoch=0;private fault=false;
 constructor(private readonly counterBits:16|32=16){if(![16,32].includes(counterBits))throw new Error('ENCODER_BITS');}
 private check(timeUs:number,a:boolean,b:boolean){if(!Number.isInteger(timeUs)||timeUs<0||timeUs>120000000||timeUs<=this.last||typeof a!=='boolean'||typeof b!=='boolean')throw new Error('ENCODER_EDGE');}
 edge(timeUs:number,a:boolean,b:boolean){
  this.check(timeUs,a,b);if(this.fault)throw new Error('ENCODER_QUADRATURE_FAULT');
  const next=Number(a)*2+Number(b),cycle=[0,1,3,2],before=this.state===null?null:cycle.indexOf(this.state),after=cycle.indexOf(next);
  let delta=0;if(before!==null){const step=(after-before+4)%4;if(step===2){this.fault=true;throw new Error('ENCODER_QUADRATURE_TRANSITION');}delta=step===1?1:step===3?-1:0;}
  const modulus=2**this.counterBits;this.raw=(this.raw+delta+modulus)%modulus;this.state=next;this.last=timeUs;
  return {timeUs,rawCount:this.raw,epoch:this.epoch,deltaCount:delta};
 }
 reset(timeUs:number,a:boolean,b:boolean){this.check(timeUs,a,b);this.state=Number(a)*2+Number(b);this.last=timeUs;this.raw=0;this.epoch++;this.fault=false;return {timeUs,rawCount:0,epoch:this.epoch,deltaCount:0};}
}
