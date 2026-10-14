export function wrapHeadingDegrees(degrees:number){if(!Number.isFinite(degrees))throw new Error('HEADING_INVALID');return ((degrees+180)%360+360)%360-180;}
export function calibrateGyroBias(rates:number[],declaredStationary:boolean){
 if(declaredStationary!==true)throw new Error('GYRO_STATIONARY_REQUIRED');
 if(rates.length<10||rates.length>200||rates.some(value=>!Number.isFinite(value)||Math.abs(value)>500))throw new Error('GYRO_CALIBRATION_SAMPLES');
 const mean=rates.reduce((sum,value)=>sum+value,0)/rates.length;
 const standardDeviation=Math.sqrt(rates.reduce((sum,value)=>sum+(value-mean)**2,0)/rates.length);
 return {biasDegreesPerSecond:mean,standardDeviationDegreesPerSecond:standardDeviation,samples:rates.length,assumption:'Learner declared stationary; constant rotation cannot be distinguished from bias by these samples alone.'};
}
export class GyroHeadingEstimator {
 private heading:number;private last=-1;private failed=false;
 constructor(initialHeadingDegrees:number,private readonly biasDegreesPerSecond:number){this.heading=wrapHeadingDegrees(initialHeadingDegrees);if(!Number.isFinite(biasDegreesPerSecond)||Math.abs(biasDegreesPerSecond)>500)throw new Error('GYRO_BIAS');}
 accept(timeMs:number,rateDegreesPerSecond:number|null){
  if(!Number.isInteger(timeMs)||timeMs<0||timeMs>120000||timeMs<=this.last)throw new Error('GYRO_TIME');
  const dtSeconds=this.last<0?0:(timeMs-this.last)/1000;
  if(rateDegreesPerSecond===null||!Number.isFinite(rateDegreesPerSecond)||Math.abs(rateDegreesPerSecond)>500||dtSeconds>.2)this.failed=true;
  if(!this.failed&&this.last>=0)this.heading=wrapHeadingDegrees(this.heading+(rateDegreesPerSecond!-this.biasDegreesPerSecond)*dtSeconds);
  const baseline=this.last<0;this.last=timeMs;
  return {timeMs,state:this.failed?'fault':baseline?'baseline':'valid',headingDegrees:this.failed?null:this.heading,rateDegreesPerSecond,dtSeconds};
 }
}
