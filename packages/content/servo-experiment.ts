import {ServoLinkageModel,ServoSweepController,type ServoModelConfiguration,type ServoAvailability} from '../simulator/servo';
import type {Program,Expression} from '../codegen';
export const servoModelDefaults:ServoModelConfiguration={minimumDegrees:60,neutralDegrees:90,maximumDegrees:120,hardMinimumDegrees:45,hardMaximumDegrees:135,degreesPerSecond:90};
export type ServoCase='limited-sweep'|'absent'|'unsupported'|'feedback-loss'|'obstruction'|'manual-stop'|'invalid-target';
export function servoTrial(configuration:ServoModelConfiguration=servoModelDefaults,caseId:ServoCase='limited-sweep'){
 if(!['limited-sweep','absent','unsupported','feedback-loss','obstruction','manual-stop','invalid-target'].includes(caseId))throw new Error('SERVO_CASE');
 const config={...configuration},model=new ServoLinkageModel(config),availability:ServoAvailability=caseId==='absent'?'absent':caseId==='unsupported'?'unsupported':'model',controller=new ServoSweepController(config,availability);
 const travelMs=(distance:number)=>Math.ceil(distance/config.degreesPerSecond*1000/20)*20;
 const highRequestMs=Math.max(1000,travelMs(config.neutralDegrees-config.minimumDegrees)+460),neutralRequestMs=Math.max(2500,highRequestMs+travelMs(config.maximumDegrees-config.minimumDegrees)+460),endMs=Math.max(4000,neutralRequestMs+travelMs(config.maximumDegrees-config.neutralDegrees)+460);
 let prior={targetDegrees:null as number|null,signalEnabled:false};
 const rows:{timeMs:number;modelAngleDegrees:number;measuredDegrees:number|null;requestDegrees:number|null;state:string;targetDegrees:number|null;signalEnabled:boolean;fault:string|null;obstructionDetected:boolean}[]=[];
 for(let timeMs=0;timeMs<=endMs;timeMs+=20){
  const step=timeMs>0?model.step(prior.targetDegrees,prior.signalEnabled,.02,caseId==='obstruction'?100:null):{blocked:false};
  const measuredDegrees=caseId==='feedback-loss'&&timeMs>=500&&timeMs<1000?null:model.angleDegrees;
  const requestDegrees=timeMs===0?(caseId==='invalid-target'?config.maximumDegrees+1:config.minimumDegrees):timeMs===highRequestMs?config.maximumDegrees:timeMs===neutralRequestMs?config.neutralDegrees:null;
  const output=controller.tick({timeMs,measuredDegrees,requestDegrees,stopRequested:caseId==='manual-stop'&&timeMs===500,blocked:step.blocked});prior=output;
  rows.push({...output,modelAngleDegrees:model.angleDegrees,measuredDegrees,requestDegrees,obstructionDetected:step.blocked});
 }
 return {schemaVersion:1,origin:'declared-unloaded-servo-linkage-model',configuration:config,availability,caseId,schedule:{lowRequestMs:0,highRequestMs,neutralRequestMs,endMs,maximumMoveMs:1500,holdMs:250},rows,metrics:{faultTimeMs:rows.find(row=>row.state==='fault')?.timeMs??null,minimumObservedDegrees:Math.min(...rows.map(row=>row.modelAngleDegrees)),maximumObservedDegrees:Math.max(...rows.map(row=>row.modelAngleDegrees)),releaseTimesMs:rows.filter((row,i)=>row.state==='released'&&i>0&&rows[i-1]!.state==='holding').map(row=>row.timeMs)},physicalVerification:'NOT RUN',hardwareDriver:'UNAVAILABLE'} as const;
}
function worksheet(target:number):Program{
 const n=(value:number):Expression=>({kind:'number',value});
 return {setup:[{kind:'print',text:'DECLARED SERVO LIMIT CHECK; NO SERVO DRIVER'}, {kind:'set',name:'target_degrees',value:n(target)}, {kind:'if',condition:{kind:'binary',op:'&&',left:{kind:'not',value:{kind:'binary',op:'<',left:{kind:'variable',name:'target_degrees'},right:n(60)}},right:{kind:'not',value:{kind:'binary',op:'>',left:{kind:'variable',name:'target_degrees'},right:n(120)}}},then:[{kind:'print',text:'DECLARED TARGET WITHIN ENVELOPE'}],otherwise:[{kind:'print',text:'DECLARED TARGET REJECTED'}]},{kind:'wait',ms:20}],loop:[]};
}
export const servoArtifact={starter:worksheet(150),reference:worksheet(120)};
