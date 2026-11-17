import type {Expression,Program} from './index';
import {validateProgram} from './index';
import {validateFunctions,type FunctionDefinition,type FunctionInstruction,type FunctionProgram} from './functions';
import {WIRELESS_MAX_STEPS,WirelessProgramSchema,type WirelessProgram,type WirelessStep} from '../contracts/arduino-wireless';

export class WirelessCompileError extends Error{
 constructor(readonly code:string,readonly blockId?:string,readonly instructionKind?:string){
  super([code,instructionKind,blockId].filter(Boolean).join(': '));this.name='WirelessCompileError';
 }
}

/** Compile only programs whose runtime behavior can be represented by the Uno command buffer. */
export function compileArduinoWireless(program:Program|FunctionProgram):WirelessProgram{
 const definitions:Map<string,FunctionDefinition>='functions' in program?validateFunctions(program).definitions:new Map();
 if(!('functions' in program))validateProgram(program);
 let budget=10000;
 const fail=(code:string,instruction?:FunctionInstruction):never=>{throw new WirelessCompileError(code,instruction?.blockId,instruction?.kind);};
 const tick=(instruction:FunctionInstruction,depth:number)=>{if(--budget<0)fail('WIRELESS_EXPANSION_LIMIT',instruction);if(depth>24)fail('WIRELESS_NESTING_LIMIT',instruction);};
 const expression=(value:Expression,parameters:ReadonlyMap<string,number>,instruction:FunctionInstruction,depth=0):number=>{
  tick(instruction,depth);
  if(value.kind==='sensor')return fail('WIRELESS_UNSUPPORTED_SENSOR',instruction);
  if(value.kind==='variable'){
   const parameter=parameters.get(value.name);if(parameter===undefined)return fail('WIRELESS_DYNAMIC_EXPRESSION',instruction);return parameter;
  }
  // AVR's double is float32. Fold with the same precision as generated Uno C++.
  if(value.kind==='number'){const result=Math.fround(value.value);if(!Number.isFinite(result))return fail('WIRELESS_EXPRESSION_RANGE',instruction);return result;}
  if(value.kind==='not')return expression(value.value,parameters,instruction,depth+1)?0:1;
  const left=expression(value.left,parameters,instruction,depth+1);
  if(value.op==='&&'&&!left)return 0;if(value.op==='||'&&left)return 1;
  const right=expression(value.right,parameters,instruction,depth+1);
  let result:number;
  switch(value.op){
   case '+':result=left+right;break;
   case '-':result=left-right;break;
   case '*':result=left*right;break;
   case '/':if(right===0)return fail('WIRELESS_EXPRESSION_RANGE',instruction);result=left/right;break;
   case '<':return Number(left<right);
   case '>':return Number(left>right);
   case '==':return Number(left===right);
   case '&&':return Number(Boolean(right));
   case '||':return Number(Boolean(right));
  }
  result=Math.fround(result);if(!Number.isFinite(result))return fail('WIRELESS_EXPRESSION_RANGE',instruction);return result;
 };
 // Check every authored branch and function, including currently unused ones: an
 // unsupported block must never disappear silently when the program is transferred.
 const supportedExpression=(value:Expression,parameters:ReadonlySet<string>,instruction:FunctionInstruction,depth=0):void=>{
  tick(instruction,depth);
  if(value.kind==='sensor')fail('WIRELESS_UNSUPPORTED_SENSOR',instruction);
  if(value.kind==='variable'&&!parameters.has(value.name))fail('WIRELESS_DYNAMIC_EXPRESSION',instruction);
  if(value.kind==='not')supportedExpression(value.value,parameters,instruction,depth+1);
  if(value.kind==='binary'){supportedExpression(value.left,parameters,instruction,depth+1);supportedExpression(value.right,parameters,instruction,depth+1);}
 };
 const supported=(body:FunctionInstruction[],parameters:ReadonlySet<string>,depth=0):void=>{
  for(const instruction of body){
   tick(instruction,depth);
   switch(instruction.kind){
    case 'drive':case 'stop':case 'wait':break;
    case 'led':if(instruction.channel===2)fail('WIRELESS_SECOND_INDICATOR',instruction);break;
    case 'waitValue':supportedExpression(instruction.value,parameters,instruction);break;
    case 'repeat':supported(instruction.body,parameters,depth+1);break;
    case 'if':supportedExpression(instruction.condition,parameters,instruction);supported(instruction.then,parameters,depth+1);supported(instruction.otherwise,parameters,depth+1);break;
    case 'call':for(const argument of instruction.arguments)supportedExpression(argument,parameters,instruction);break;
    default:fail('WIRELESS_UNSUPPORTED_BLOCK',instruction);
   }
  }
 };
 supported(program.setup,new Set());supported(program.loop,new Set());
 for(const definition of definitions.values())supported(definition.body,new Set(definition.parameters));
 const steps:WirelessStep[]=[];
 const emit=(step:WirelessStep,instruction:FunctionInstruction)=>{if(steps.length>=WIRELESS_MAX_STEPS)fail('WIRELESS_PROGRAM_LIMIT',instruction);steps.push(step);};
 const pwm=(percent:number)=>Math.sign(percent)*Math.floor(Math.abs(percent)*255/100+0.5);
 const lower=(body:FunctionInstruction[],parameters:ReadonlyMap<string,number>,depth=0):void=>{
  for(const instruction of body){
   tick(instruction,depth);
   switch(instruction.kind){
    case 'drive':emit({op:'m',a:pwm(instruction.left),b:pwm(instruction.right)},instruction);break;
    case 'stop':emit({op:'s',a:0,b:0},instruction);break;
    case 'wait':emit({op:'w',a:instruction.ms,b:0},instruction);break;
    case 'waitValue':{
     const duration=expression(instruction.value,parameters,instruction);if(!Number.isInteger(duration)||duration<0||duration>60000)fail('WIRELESS_WAIT_RANGE',instruction);
     emit({op:'w',a:duration,b:0},instruction);break;
    }
    case 'led':emit({op:'l',a:instruction.on?1:0,b:0},instruction);break;
    case 'repeat':for(let repeat=0;repeat<instruction.count;repeat++){tick(instruction,depth);lower(instruction.body,parameters,depth+1);}break;
    case 'if':lower(expression(instruction.condition,parameters,instruction)?instruction.then:instruction.otherwise,parameters,depth+1);break;
    case 'call':{
     const definition=definitions.get(instruction.name);if(!definition)return fail('WIRELESS_FUNCTION_UNKNOWN',instruction);
     const values=instruction.arguments.map(argument=>expression(argument,parameters,instruction));
     lower(definition.body,new Map(definition.parameters.map((name,index)=>[name,values[index]!])),depth+1);break;
    }
    default:fail('WIRELESS_UNSUPPORTED_BLOCK',instruction);
   }
  }
 };
 lower(program.setup,new Map());const loopStart=steps.length;lower(program.loop,new Map());
 if(!steps.length)fail('WIRELESS_EMPTY_PROGRAM');
 return WirelessProgramSchema.parse({version:1,steps,loopStart:steps.length===loopStart?-1:loopStart});
}
