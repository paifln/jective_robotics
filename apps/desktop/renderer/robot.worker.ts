import type {FunctionProgram} from '../../../packages/codegen/functions';
import {RobotSimulation,type World} from '../../../packages/simulator';
import type {Program} from '../../../packages/codegen';
let engine:RobotSimulation|null=null,operationId='';
self.onmessage=(event:MessageEvent<{type:'init'|'step'|'cancel';operationId:string;program?:Program|FunctionProgram;world?:World;ticks?:number}>)=>{const request=event.data;try{if(request.type==='init'){operationId=request.operationId;engine=new RobotSimulation(request.program!,request.world!);}else if(request.operationId===operationId&&engine){if(request.type==='cancel')engine.cancel();else engine.step(request.ticks??1);}else return;self.postMessage({operationId,state:engine!.state});}catch(e){self.postMessage({operationId:request.operationId,error:String(e)});}};
