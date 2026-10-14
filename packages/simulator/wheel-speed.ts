export type SpeedFeedback='baseline'|'valid'|'missing'|'reset';
export interface SpeedInput {timeMs:number;requestedMps:number;measuredMps:number|null;feedback:SpeedFeedback;stopRequested:boolean}
export function speedCorrection(requestedMps:number,measuredMps:number,gain:number){
 if(!Number.isFinite(requestedMps)||requestedMps<0||requestedMps>.3||!Number.isFinite(measuredMps)||measuredMps<0||measuredMps>1||!Number.isFinite(gain)||gain<0||gain>1000)throw new Error('WHEEL_SPEED_CONFIG');
 const error=requestedMps-measuredMps,rawCorrection=gain*error,correction=Math.max(-30,Math.min(30,rawCorrection)),feedforward=requestedMps/.6*100;
 return {error,rawCorrection,correction,feedforward,commandPercent:Math.max(0,Math.min(60,feedforward+correction))};
}
/** Forward-only bench. Valid zero feedback arms; an initial baseline alone does not. */
export class WheelFeedbackGate {
 private state:'waiting'|'running'|'stopped'|'fault'='waiting';private last=-1;
 update(input:SpeedInput){
  if(!Number.isInteger(input.timeMs)||input.timeMs<0||input.timeMs>120000||input.timeMs<=this.last)throw new Error('WHEEL_SPEED_TIME');
  const requestValid=Number.isFinite(input.requestedMps)&&input.requestedMps>=0&&input.requestedMps<=.3;
  const measuredValid=input.measuredMps!==null&&Number.isFinite(input.measuredMps)&&input.measuredMps>=0&&input.measuredMps<=1;
  if(input.stopRequested||!requestValid||(this.last>=0&&input.timeMs-this.last>200))this.state='fault';
  else if(this.state!=='fault'&&this.state!=='stopped'){
   if(input.requestedMps===0)this.state='stopped';
   else if(input.feedback==='baseline'&&this.state==='waiting'&&input.timeMs<=300){}
   else if(input.feedback!=='valid'||!measuredValid)this.state='fault';
   else this.state='running';
  }
  const dtSeconds=this.last<0?0:(input.timeMs-this.last)/1000;this.last=input.timeMs;
  return {state:this.state,dtSeconds};
 }
}
export class WheelSpeedController {
 private gate=new WheelFeedbackGate();
 constructor(private readonly gain:number){speedCorrection(0,0,gain);}
 tick(input:SpeedInput){const {state}=this.gate.update(input);const correction=state==='running'?speedCorrection(input.requestedMps,input.measuredMps!,this.gain):null;return {timeMs:input.timeMs,state,commandPercent:correction?.commandPercent??0,correction};}
}
/** Declared first-order wheel plant, not an electrical torque or hardware model. */
export class WheelSpeedPlant {
 speedMps=0;travelMeters=0;
 step(commandPercent:number,loadFactor:number,dtSeconds=.02){
  if(!Number.isFinite(commandPercent)||commandPercent<0||commandPercent>60||!Number.isFinite(loadFactor)||loadFactor<.3||loadFactor>1||!Number.isFinite(dtSeconds)||dtSeconds<=0||dtSeconds>.1)throw new Error('WHEEL_PLANT_INPUT');
  const target=.6*commandPercent/100*loadFactor,tau=.25,decay=Math.exp(-dtSeconds/tau),before=this.speedMps;
  this.travelMeters+=target*dtSeconds+(before-target)*tau*(1-decay);
  this.speedMps=target+(before-target)*decay;
  return {speedMps:this.speedMps,travelMeters:this.travelMeters};
 }
}
