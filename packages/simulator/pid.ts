import {WheelFeedbackGate,type SpeedInput} from './wheel-speed';
export interface PidConfiguration {kp:number;ki:number;kd:number}
export function validatePidConfiguration(config:PidConfiguration){if(!Number.isFinite(config.kp)||config.kp<0||config.kp>1000||!Number.isFinite(config.ki)||config.ki<0||config.ki>1000||!Number.isFinite(config.kd)||config.kd<0||config.kd>100)throw new Error('PID_CONFIG');return {...config};}
export class WheelPidController {
 private readonly config:PidConfiguration;private readonly gate=new WheelFeedbackGate();private integral=0;private filteredDerivative=0;private previousMeasurement:number|null=null;
 constructor(configuration:PidConfiguration,private readonly conditionalIntegration=true){this.config=validatePidConfiguration(configuration);if(typeof conditionalIntegration!=='boolean')throw new Error('PID_PROTECTION_CONFIG');}
 tick(input:SpeedInput){
  const {state,dtSeconds}=this.gate.update(input);
  if(state!=='running'){this.integral=0;this.filteredDerivative=0;this.previousMeasurement=null;return {timeMs:input.timeMs,state,commandPercent:0,terms:null};}
  const error=input.requestedMps-input.measuredMps!,p=this.config.kp*error;
  const derivative=dtSeconds>0&&this.previousMeasurement!==null?(input.measuredMps!-this.previousMeasurement)/dtSeconds:0;
  const alpha=dtSeconds>0?dtSeconds/(.1+dtSeconds):0;this.filteredDerivative+=alpha*(derivative-this.filteredDerivative);
  const d=-this.config.kd*this.filteredDerivative,feedforward=input.requestedMps/.6*100;
  const candidateIntegral=Math.max(-30,Math.min(30,this.integral+this.config.ki*error*dtSeconds));
  const candidate=p+candidateIntegral+d,lower=Math.max(-30,-feedforward),upper=Math.min(30,60-feedforward);
  const blocked=this.conditionalIntegration&&this.config.ki>0&&((candidate>upper&&error>0)||(candidate<lower&&error<0));
  if(!blocked)this.integral=candidateIntegral;
  const rawCorrection=p+this.integral+d,correction=Math.max(-30,Math.min(30,rawCorrection)),commandPercent=Math.max(0,Math.min(60,feedforward+correction));
  this.previousMeasurement=input.measuredMps;
  return {timeMs:input.timeMs,state,commandPercent,terms:{error,p,integral:this.integral,d,filteredDerivative:this.filteredDerivative,candidateIntegral,antiWindupBlocked:blocked,rawCorrection,correction,saturated:rawCorrection<lower||rawCorrection>upper}};
 }
}
