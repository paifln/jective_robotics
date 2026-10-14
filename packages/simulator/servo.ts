export interface ServoEnvelope {minimumDegrees:number;neutralDegrees:number;maximumDegrees:number}
export interface ServoModelConfiguration extends ServoEnvelope {hardMinimumDegrees:number;hardMaximumDegrees:number;degreesPerSecond:number}
export type ServoAvailability='model'|'absent'|'unsupported';
export function validateServoEnvelope(envelope:ServoEnvelope){
 if(![envelope.minimumDegrees,envelope.neutralDegrees,envelope.maximumDegrees].every(Number.isFinite)||envelope.minimumDegrees<0||envelope.maximumDegrees>180||envelope.minimumDegrees>=envelope.neutralDegrees||envelope.neutralDegrees>=envelope.maximumDegrees)throw new Error('SERVO_ENVELOPE');return {...envelope};
}
export class ServoSweepController {
 private readonly envelope:ServoEnvelope;private state:'released'|'moving'|'holding'|'fault'='released';private last=-1;private started=0;private arrived=0;private target:number|null=null;private fault:string|null=null;
 constructor(envelope:ServoEnvelope,private readonly availability:ServoAvailability){this.envelope=validateServoEnvelope(envelope);if(!['model','absent','unsupported'].includes(availability))throw new Error('SERVO_AVAILABILITY');}
 tick(input:{timeMs:number;measuredDegrees:number|null;requestDegrees:number|null;stopRequested:boolean;blocked:boolean}){
  const {timeMs,measuredDegrees,requestDegrees}=input;
  if(!Number.isInteger(timeMs)||timeMs<0||timeMs>120000||timeMs<=this.last)throw new Error('SERVO_TIME');
  const fail=(reason:string)=>{this.state='fault';this.fault=reason;this.target=null;};
  if(this.state!=='fault'){
   if(this.availability!=='model')fail(this.availability==='absent'?'SERVO_ABSENT':'SERVO_UNSUPPORTED');
   else if(input.stopRequested)fail('SERVO_STOP');
   else if(this.last>=0&&timeMs-this.last>100)fail('SERVO_CADENCE');
   else if(measuredDegrees===null||!Number.isFinite(measuredDegrees)||measuredDegrees<0||measuredDegrees>180)fail('SERVO_FEEDBACK');
   else if(measuredDegrees<this.envelope.minimumDegrees||measuredDegrees>this.envelope.maximumDegrees)fail('SERVO_POSITION_LIMIT');
   else if(input.blocked)fail('SERVO_OBSTRUCTION');
   else if(requestDegrees!==null){
    if(!Number.isFinite(requestDegrees)||requestDegrees<this.envelope.minimumDegrees||requestDegrees>this.envelope.maximumDegrees)fail('SERVO_TARGET');
    else if(this.state!=='released')fail('SERVO_BUSY');
    else {this.target=requestDegrees;this.started=timeMs;this.state='moving';}
   }
   if(this.state==='moving'){
    if(Math.abs(measuredDegrees!-this.target!)<=.01){this.arrived=timeMs;this.state='holding';}
    else if(timeMs-this.started>=1500)fail('SERVO_TIMEOUT');
   }
   if(this.state==='holding'&&timeMs-this.arrived>=250){this.state='released';this.target=null;}
  }
  this.last=timeMs;
  return {timeMs,state:this.state,targetDegrees:this.target,signalEnabled:this.state==='moving'||this.state==='holding',fault:this.fault};
 }
}
/** Declared unloaded linkage model. Released means zero simulated effort, not a physical torque guarantee. */
export class ServoLinkageModel {
 readonly configuration:ServoModelConfiguration;angleDegrees:number;
 constructor(configuration:ServoModelConfiguration){
  validateServoEnvelope(configuration);
  if(![configuration.hardMinimumDegrees,configuration.hardMaximumDegrees,configuration.degreesPerSecond].every(Number.isFinite)||configuration.hardMinimumDegrees<0||configuration.hardMaximumDegrees>180||configuration.minimumDegrees<configuration.hardMinimumDegrees+5||configuration.maximumDegrees>configuration.hardMaximumDegrees-5||configuration.degreesPerSecond<30||configuration.degreesPerSecond>180)throw new Error('SERVO_MODEL_CONFIG');
  this.configuration={...configuration};this.angleDegrees=configuration.neutralDegrees;
 }
 step(targetDegrees:number|null,signalEnabled:boolean,dtSeconds=.02,obstructionDegrees:number|null=null){
  if(!Number.isFinite(dtSeconds)||dtSeconds<=0||dtSeconds>.1||typeof signalEnabled!=='boolean'||(targetDegrees!==null&&(!Number.isFinite(targetDegrees)||targetDegrees<0||targetDegrees>180))||(obstructionDegrees!==null&&(!Number.isFinite(obstructionDegrees)||obstructionDegrees<this.configuration.hardMinimumDegrees||obstructionDegrees>this.configuration.hardMaximumDegrees)))throw new Error('SERVO_MODEL_INPUT');
  if(!signalEnabled||targetDegrees===null)return {blocked:false,simulatedEffort:false};
  const delta=targetDegrees-this.angleDegrees,next=this.angleDegrees+Math.sign(delta)*Math.min(Math.abs(delta),this.configuration.degreesPerSecond*dtSeconds);
  const hard=Math.max(this.configuration.hardMinimumDegrees,Math.min(this.configuration.hardMaximumDegrees,next));
  const obstruction=obstructionDegrees!==null&&((this.angleDegrees<=obstructionDegrees&&next>obstructionDegrees)||(this.angleDegrees>=obstructionDegrees&&next<obstructionDegrees));
  this.angleDegrees=obstruction?obstructionDegrees!:hard;
  return {blocked:obstruction||next!==hard,simulatedEffort:true};
 }
}
