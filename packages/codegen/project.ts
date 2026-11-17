import type {Project} from '../contracts';
import {indicatorPin,projectProfile} from '../profiles/project';
import {arduinoUnoRobotWiring,hasArduinoUnoRobotWiring} from './arduino-uno-driver';
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
 const profile=projectProfile(project);
 const unoRobot=hasArduinoUnoRobotWiring(project);
 if(unoRobot){
  const reserved=new Set([2,3,4,5,6,9,10]);
  for(const [role,pin] of Object.entries(project.wiring??{}))if(pin!==null&&reserved.has(pin)&&arduinoUnoRobotWiring[role as keyof typeof arduinoUnoRobotWiring]!==pin)throw new Error('PIN_CONFLICT: pin is used by the Arduino robot');
 }
 return generate(program,indicatorPin(project),usesPWM?resolveIndicatorPWM(project):undefined,unoRobot?'arduino-uno-robot':profile.core==='arduino:avr'?'arduino-avr':'esp32');
}
