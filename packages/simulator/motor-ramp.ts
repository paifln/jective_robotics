import {SafeMotorModel} from './safe-motor';
export interface RampRow {timeMs:number;requestedPercent:number;abruptReferencePercent:number;leftPercent:number;rightPercent:number;mode:string}
export function motorRampExperiment(){
 const model=new SafeMotorModel();model.arm(0,true,true);model.drive(20,20,2000,1,0);
 const rows:RampRow[]=[];
 for(let timeMs=0;timeMs<=1400;timeMs+=20){
  if(timeMs===600)model.drive(-20,-20,800,2,timeMs);
  if(timeMs===1200)model.disarm();
  const requestedPercent=timeMs<600?20:timeMs<1200?-20:0;
  const sample=model.tick(timeMs);rows.push({timeMs,requestedPercent,abruptReferencePercent:requestedPercent,leftPercent:sample.left,rightPercent:sample.right,mode:sample.mode});
 }
 const before=rows.find(row=>row.timeMs===580)!;
 const negative=rows.find(row=>row.timeMs>=600&&row.leftPercent<0)!;
 const zeroRows=rows.filter(row=>row.timeMs>=600&&row.timeMs<negative.timeMs);
 return {schemaVersion:1,origin:'simulation',scenario:'bounded-reversal',units:'percent duty',controllerMode:'autonomous model with stop input declared available',limits:{maximumDuty:30,accelerationPercentPerSecond:40,minimumReversalPauseMs:50},rows,reversal:{commandTimeMs:600,positiveBefore:before.leftPercent,firstNegativeTimeMs:negative.timeMs,observedZeroIntervalMs:negative.timeMs-600,zeroSampleTimes:zeroRows.map(row=>row.timeMs)},abruptReference:'Hypothetical instantaneous copy of requested command; not firmware or physical output',physicalVerification:'NOT RUN'} as const;
}
