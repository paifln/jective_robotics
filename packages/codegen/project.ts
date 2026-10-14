import type {Project} from '../contracts';
import {indicatorPin} from '../profiles/project';
import {resolveIndicatorPWM} from '../profiles/pwm';
import {allInstructions,generate,type Program} from './index';
import {validateFunctions,type FunctionProgram,type FunctionInstruction} from './functions';
export function generateForProject(program:Program|FunctionProgram,project:Project):string{
 let usesPWM=false;
 if('functions' in program){
  validateFunctions(program);
  const visit=(body:FunctionInstruction[])=>{for(const i of body){if(i.kind==='pwm')usesPWM=true;if(i.kind==='if'){visit(i.then);visit(i.otherwise);}if(i.kind==='while'||i.kind==='repeat')visit(i.body);}};
  visit(program.setup);visit(program.loop);for(const definition of program.functions)visit(definition.body);
 }else usesPWM=allInstructions(program).some(i=>i.kind==='pwm');
 return generate(program,indicatorPin(project),usesPWM?resolveIndicatorPWM(project):undefined);
}
