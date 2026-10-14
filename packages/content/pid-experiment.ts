import {WheelPidController,type PidConfiguration} from '../simulator/pid';
import {runWheelBench,type WheelBenchCase} from '../simulator/wheel-bench';
import {encoderDefaults} from './encoder-experiment';
import type {EncoderConfiguration} from '../simulator/encoder';
import type {Program,Expression,Instruction} from '../codegen';
export function pidTrial(configuration:PidConfiguration,loadedFactor=.55,caseId:WheelBenchCase='load-change',encoderConfiguration:EncoderConfiguration=encoderDefaults,conditionalIntegration=true){
 const bench=runWheelBench(new WheelPidController(configuration,conditionalIntegration),loadedFactor,caseId,encoderConfiguration);
 const rows=bench.rows.map(({control,...row})=>({...row,terms:control.terms}));
 const release=rows.filter(row=>row.timeMs>=4000&&row.timeMs<6000);
 return {schemaVersion:1,origin:'quantized-first-order-wheel-model',configuration:{...configuration},conditionalIntegration,loadedFactor,caseId,...bench,rows,metrics:{...bench.metrics,releasePeakModelMps:Math.max(...release.map(row=>row.modelSpeedMps)),blockedIntegrationSamples:rows.filter(row=>row.terms?.antiWindupBlocked).length},physicalVerification:'NOT RUN'} as const;
}
export function comparePid(kp=400,ki=300,kd=10,loadedFactor=.55,caseId:WheelBenchCase='load-change'){
 return {p:pidTrial({kp,ki:0,kd:0},loadedFactor,caseId),pi:pidTrial({kp,ki,kd:0},loadedFactor,caseId),pid:pidTrial({kp,ki,kd},loadedFactor,caseId),clampOnly:pidTrial({kp,ki,kd},loadedFactor,caseId,encoderDefaults,false),scope:'Identical quantized encoder, first-order wheel, load schedule and clock. Derivative acts on filtered measurement. Clamp-only diagnostic retains integral bounds but omits conditional integration. Results describe this bench, not all robots.'};
}
function pidWorksheet(ki:number):Program{
 const n=(value:number):Expression=>({kind:'number',value}),v=(name:string):Expression=>({kind:'variable',name});
 const b=(op:'+'|'*',left:Expression,right:Expression):Expression=>({kind:'binary',op,left,right});
 const set=(name:string,value:Expression):Instruction=>({kind:'set',name,value});
 return {setup:[{kind:'print',text:'DECLARED PID UPDATE; NOT BOARD FEEDBACK'},set('error_mps',n(.04)),set('elapsed_seconds',n(.1)),set('ki',n(ki)),set('integral_percent',b('*',b('*',v('ki'),v('error_mps')),v('elapsed_seconds'))),set('command_percent',b('+',n(46),v('integral_percent'))),{kind:'printValue',label:'declared integral percent=',value:v('integral_percent')},{kind:'printValue',label:'declared command percent=',value:v('command_percent')},{kind:'wait',ms:20}],loop:[]};
}
export const pidArtifact={starter:pidWorksheet(0),reference:pidWorksheet(300)};
