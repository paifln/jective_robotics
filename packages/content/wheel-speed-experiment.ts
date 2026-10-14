import {WheelSpeedController} from '../simulator/wheel-speed';
import {runWheelBench,type WheelBenchCase} from '../simulator/wheel-bench';
import type {EncoderConfiguration} from '../simulator/encoder';
import {encoderDefaults} from './encoder-experiment';
import type {Program,Instruction,Expression} from '../codegen';
export type WheelSpeedCase=WheelBenchCase;
export function wheelSpeedTrial(gain=400,loadedFactor=.55,caseId:WheelSpeedCase='load-change',encoderConfiguration:EncoderConfiguration=encoderDefaults){
 const bench=runWheelBench(new WheelSpeedController(gain),loadedFactor,caseId,encoderConfiguration);
 const rows=bench.rows.map(({control,...row})=>({...row,correction:control.correction?.correction??null}));
 return {schemaVersion:1,origin:'quantized-first-order-wheel-model',gain,loadedFactor,caseId,...bench,rows,physicalVerification:'NOT RUN'} as const;
}
export function compareWheelSpeed(gain=400,loadedFactor=.55,caseId:WheelSpeedCase='load-change',encoderConfiguration:EncoderConfiguration=encoderDefaults){return {openLoop:wheelSpeedTrial(0,loadedFactor,caseId,encoderConfiguration),closedLoop:wheelSpeedTrial(gain,loadedFactor,caseId,encoderConfiguration),scope:'Same first-order wheel, load schedule and quantized encoder. Zero gain omits speed correction but retains feedback fault checks.'};}
const n=(value:number):Expression=>({kind:'number',value}),v=(name:string):Expression=>({kind:'variable',name});
function speedWorksheet(gain:number):Program{
 const set=(name:string,value:Expression):Instruction=>({kind:'set',name,value});
 const binary=(op:'+'|'-'|'*'|'/'|'>'|'<',left:Expression,right:Expression):Expression=>({kind:'binary',op,left,right});
 const clip=(name:string,min:number,max:number):Instruction[]=>[{kind:'if',condition:binary('<',v(name),n(min)),then:[set(name,n(min))],otherwise:[]},{kind:'if',condition:binary('>',v(name),n(max)),then:[set(name,n(max))],otherwise:[]}];
 return {setup:[{kind:'print',text:'DECLARED SPEED CALCULATION; NOT BOARD FEEDBACK'},set('requested_mps',n(.18)),set('declared_measured_mps',n(.14)),set('gain',n(gain)),set('correction',binary('*',v('gain'),binary('-',v('requested_mps'),v('declared_measured_mps')))),...clip('correction',-30,30),set('command_percent',binary('+',binary('*',binary('/',v('requested_mps'),n(.6)),n(100)),v('correction'))),...clip('command_percent',0,60),{kind:'printValue',label:'declared command percent=',value:v('command_percent')},{kind:'wait',ms:20}],loop:[]};
}
export const wheelSpeedArtifact={starter:speedWorksheet(0),reference:speedWorksheet(400)};
