import {formatPrintedValue} from '../codegen/print-value';
import {checkedSound} from './sound';
import {checkedPWMPercent} from '../profiles/pwm';
import {checkedWaitMs,type Expression} from '../codegen';
import {validateFunctions,type FunctionProgram,type FunctionInstruction} from '../codegen/functions';
import {evaluateExpression} from './expression';
import type {TraceEvent} from './index';

/** Indicator-only function execution. Parameters are passed by value, globals remain shared. */
export function interpretFunctions(program:FunctionProgram,durationMs:number,maxInstructions=10000):TraceEvent[]{
 const {definitions}=validateFunctions(program);
 if(!Number.isFinite(durationMs)||durationMs<0||durationMs>3600000)throw new Error('SIM_DURATION');
 if(!Number.isSafeInteger(maxInstructions)||maxInstructions<1)throw new Error('SIM_INSTRUCTION_BUDGET');
 let time=0,steps=0;const trace:TraceEvent[]=[];const globals=new Map<string,number>();let frame=new Map<string,number>();
 const consume=()=>{if(++steps>maxInstructions)throw new Error('SIM_INSTRUCTION_BUDGET');};
 const expression=(value:Expression)=>evaluateExpression(value,name=>frame.get(name)??globals.get(name)??0,()=>{throw new Error('Use the robot world simulator for sensor expressions');});
 const execute=(body:FunctionInstruction[]):void=>{for(const instruction of body){if(time>durationMs)return;consume();
  if(instruction.kind==='call'){
   const definition=definitions.get(instruction.name)!;
   const values=instruction.arguments.map(expression),previous=frame;
   frame=new Map(definition.parameters.map((name,index)=>[name,values[index]!]));
   try{execute(definition.body);}finally{frame=previous;}
  }else if(instruction.kind==='set'){
   const value=expression(instruction.value);(frame.has(instruction.name)?frame:globals).set(instruction.name,value);
  }else if(instruction.kind==='wait')time+=instruction.ms;
  else if(instruction.kind==='waitValue')time+=checkedWaitMs(expression(instruction.value));
  else if(instruction.kind==='if')execute(expression(instruction.condition)?instruction.then:instruction.otherwise);
  else if(instruction.kind==='repeat'){for(let n=0;n<instruction.count&&time<=durationMs;n++){consume();execute(instruction.body);}}
  else if(instruction.kind==='while'){let iterations=0;while(time<=durationMs){consume();if(!expression(instruction.condition))break;if(iterations++>=instruction.maxIterations)throw new Error('LOOP_BUDGET');execute(instruction.body);}}
  else if(instruction.kind==='sound'){checkedSound(instruction);trace.push({timeMs:time,kind:'sound',value:instruction.frequencyHz,durationMs:instruction.durationMs});}
  else if(instruction.kind==='soundStop')trace.push({timeMs:time,kind:'soundStop',value:0});
  else if(instruction.kind==='pwm')trace.push({timeMs:time,kind:'pwm',value:checkedPWMPercent(expression(instruction.value)),...(instruction.channel===2?{channel:2 as const}:{})});
  else if(instruction.kind==='printValue')trace.push({timeMs:time,kind:'print',value:formatPrintedValue(instruction.label,expression(instruction.value))});
  else if(instruction.kind==='print'||instruction.kind==='led')trace.push({timeMs:time,kind:instruction.kind,value:instruction.kind==='print'?instruction.text:instruction.on,...(instruction.kind==='led'&&instruction.channel===2?{channel:2 as const}:{})});
  else throw new Error('Use the robot world simulator for motion blocks');
 }};
 execute(program.setup);while(time<=durationMs&&program.loop.length)execute(program.loop);return trace;
}
