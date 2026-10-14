import {WheelSpeedPlant,type SpeedInput,type SpeedFeedback} from './wheel-speed';
import {EncoderCounterAdapter,type EncoderConfiguration} from './encoder';
export type WheelBenchCase='load-change'|'feedback-loss'|'manual-stop';
/** Shared plant, clock and sensor path for controlled P/PI/PID comparisons. */
export function runWheelBench<T extends {state:string;commandPercent:number}>(controller:{tick(input:SpeedInput):T},loadedFactor:number,caseId:WheelBenchCase,configuration:EncoderConfiguration){
 if(!Number.isFinite(loadedFactor)||loadedFactor<.3||loadedFactor>1||!['load-change','feedback-loss','manual-stop'].includes(caseId))throw new Error('WHEEL_SPEED_CASE');
 const encoderConfig={...configuration},plant=new WheelSpeedPlant(),encoder=new EncoderCounterAdapter(encoderConfig);
 let command=0,lastAcceptedMs=0,measuredMps:number|null=null;
 const rows:{timeMs:number;requestedMps:number;modelSpeedMps:number;estimatedMps:number|null;feedback:SpeedFeedback;rawCount:number|null;deltaCount:number|null;sampleWindowMs:number|null;commandPercent:number;state:string;loadFactor:number;control:T}[]=[];
 const raw=()=>Math.trunc(plant.travelMeters/encoderConfig.wheelCircumferenceMeters*encoderConfig.countsPerWheelRevolution)%2**encoderConfig.counterBits;
 for(let timeMs=0;timeMs<=8000;timeMs+=20){
  const loadFactor=timeMs>=2000&&timeMs<4000?loadedFactor:1,requestedMps=timeMs<6000?.18:0;
  if(timeMs%100===0){
   const missing=caseId==='feedback-loss'&&timeMs>=3000&&timeMs<3500;
   let feedback:SpeedFeedback=missing?'missing':timeMs===0?'baseline':'valid',rawCount:number|null=null,deltaCount:number|null=null,sampleWindowMs:number|null=null;
   if(!missing){rawCount=raw();const count=encoder.accept({timeMs,rawCount,epoch:0});feedback=count.status==='baseline'?'baseline':'valid';if(feedback==='valid'){sampleWindowMs=timeMs-lastAcceptedMs;deltaCount=count.deltaCount;measuredMps=count.deltaCount/encoderConfig.countsPerWheelRevolution*encoderConfig.wheelCircumferenceMeters/(sampleWindowMs/1000);}lastAcceptedMs=timeMs;}else measuredMps=null;
   const control=controller.tick({timeMs,requestedMps,measuredMps,feedback,stopRequested:caseId==='manual-stop'&&timeMs===3000});command=control.commandPercent;
   rows.push({timeMs,requestedMps,modelSpeedMps:plant.speedMps,estimatedMps:measuredMps,feedback,rawCount,deltaCount,sampleWindowMs,commandPercent:command,state:control.state,loadFactor,control});
  }
  if(timeMs<8000)plant.step(command,loadFactor);
 }
 const loaded=rows.filter(row=>row.timeMs>=3000&&row.timeMs<4000&&row.estimatedMps!==null),meanAbsoluteError=loaded.reduce((sum,row)=>sum+Math.abs(row.requestedMps-row.estimatedMps!),0)/loaded.length;
 const stop=rows.find(row=>row.state==='fault'||row.state==='stopped'),settled=stop?rows.find(row=>row.timeMs>=stop.timeMs&&row.modelSpeedMps<=.001):null;
 return {config:{nominalMaximumMps:.6,timeConstantSeconds:.25,plantStepMs:20,controllerSampleMs:100,encoder:encoderConfig,correctionLimitPercent:30,commandLimitPercent:60},rows,metrics:{loadedMeanAbsoluteErrorMps:loaded.length?meanAbsoluteError:null,stopRequestedMs:stop?.timeMs??null,modelBelowOneMillimeterPerSecondMs:settled?.timeMs??null}};
}
