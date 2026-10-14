import {calibrateGyroBias,GyroHeadingEstimator,wrapHeadingDegrees} from '../simulator/orientation';
import type {Program} from '../codegen';
export type OrientationCase='normal'|'missing-signal'|'moving-calibration';
const noisePattern=[0,1,-1,.5,-.5];
export function orientationTrial(biasDegreesPerSecond=2,noiseAmplitudeDegreesPerSecond=1,caseId:OrientationCase='normal'){
 if(!Number.isFinite(biasDegreesPerSecond)||Math.abs(biasDegreesPerSecond)>5||!Number.isFinite(noiseAmplitudeDegreesPerSecond)||noiseAmplitudeDegreesPerSecond<0||noiseAmplitudeDegreesPerSecond>5||!['normal','missing-signal','moving-calibration'].includes(caseId))throw new Error('ORIENTATION_CONFIG');
 const calibrationSamples=Array.from({length:20},(_,i)=>(caseId==='moving-calibration'?45:0)+biasDegreesPerSecond+noisePattern[i%5]!*noiseAmplitudeDegreesPerSecond);
 let calibration:ReturnType<typeof calibrateGyroBias>|null=null,calibrationFault:string|null=null;
 try{calibration=calibrateGyroBias(calibrationSamples,caseId!=='moving-calibration');}catch(error){calibrationFault=error instanceof Error?error.message:'GYRO_CALIBRATION_FAILED';}
 const initialHeadingDegrees=170,uncalibrated=new GyroHeadingEstimator(initialHeadingDegrees,0),calibrated=calibration?new GyroHeadingEstimator(initialHeadingDegrees,calibration.biasDegreesPerSecond):null;
 let truthUnwrapped=initialHeadingDegrees;
 const rows=[];
 for(let timeMs=0;timeMs<=8000;timeMs+=100){
  const trueRateDegreesPerSecond=timeMs>2000&&timeMs<=6000?45:0;
  if(timeMs>0)truthUnwrapped+=trueRateDegreesPerSecond*.1;
  const simulatedRateDegreesPerSecond=caseId==='missing-signal'&&timeMs>=4000&&timeMs<4500?null:trueRateDegreesPerSecond+biasDegreesPerSecond+noisePattern[timeMs/100%5]!*noiseAmplitudeDegreesPerSecond;
  const raw=uncalibrated.accept(timeMs,simulatedRateDegreesPerSecond),corrected=calibrated?.accept(timeMs,simulatedRateDegreesPerSecond)??null,truthHeadingDegrees=wrapHeadingDegrees(truthUnwrapped);
  rows.push({timeMs,truthHeadingDegrees,trueRateDegreesPerSecond,simulatedRateDegreesPerSecond,uncalibratedHeadingDegrees:raw.headingDegrees,calibratedHeadingDegrees:corrected?.headingDegrees??null,uncalibratedState:raw.state,calibratedState:corrected?.state??'calibration-rejected',uncalibratedErrorDegrees:raw.headingDegrees===null?null:wrapHeadingDegrees(raw.headingDegrees-truthHeadingDegrees),calibratedErrorDegrees:corrected?.headingDegrees==null?null:wrapHeadingDegrees(corrected.headingDegrees-truthHeadingDegrees)});
 }
 return {schemaVersion:1,origin:'declared-gyro-rate-model',caseId,configuration:{biasDegreesPerSecond,noiseAmplitudeDegreesPerSecond,sampleIntervalMs:100,initialHeadingDegrees,noisePattern:[...noisePattern],calibrationOrigin:caseId==='moving-calibration'?'declared-moving-model-samples':'declared-stationary-model-samples'},calibrationSamples,calibration,calibrationFault,rows,physicalVerification:'NOT RUN',hardwareDriver:'UNAVAILABLE',scope:'Relative heading integration from a supplied initial angle. Bias calibration does not establish absolute heading; truth is separately declared model data.'} as const;
}
function orientationWorksheet(bias:number):Program{return {setup:[{kind:'print',text:'DECLARED GYRO DRIFT CALCULATION; NO IMU DRIVER'},{kind:'set',name:'bias_degrees_per_second',value:{kind:'number',value:bias}},{kind:'set',name:'elapsed_seconds',value:{kind:'number',value:8}},{kind:'set',name:'drift_degrees',value:{kind:'binary',op:'*',left:{kind:'variable',name:'bias_degrees_per_second'},right:{kind:'variable',name:'elapsed_seconds'}}},{kind:'printValue',label:'declared drift degrees=',value:{kind:'variable',name:'drift_degrees'}},{kind:'wait',ms:20}],loop:[]};}
export const orientationArtifact={starter:orientationWorksheet(2),reference:orientationWorksheet(0)};
