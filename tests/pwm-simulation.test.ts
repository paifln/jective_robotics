import {it,expect} from 'vitest';
import {interpret,RobotSimulation,worlds} from '../packages/simulator';
import {interpretFunctions} from '../packages/simulator/functions';
import {generate,validateProgram,type Program} from '../packages/codegen';
import type {FunctionProgram} from '../packages/codegen/functions';
const number=(value:number)=>({kind:'number' as const,value});
it('bounded PWM sweeps retain exact percentage commands and share binary indicator state',()=>{
 const program:Program={setup:[0,25,50,75,100].flatMap(value=>[{kind:'pwm' as const,value:number(value)},{kind:'wait' as const,ms:20}]),loop:[]};
 expect(interpret(program,100).map(e=>[e.timeMs,e.value])).toEqual([[0,0],[20,25],[40,50],[60,75],[80,100]]);
 const simulation=new RobotSimulation(program,worlds[0]!);for(const value of [0,25,50,75,100]){const state=simulation.step();expect(state.ledDuty).toBe(value);expect(state.led).toBe(value>0);}
 const mixed:Program={setup:[{kind:'pwm',value:number(33.3),channel:2},{kind:'led',on:true},{kind:'wait',ms:20},{kind:'led',on:false,channel:2}],loop:[]};const robot=new RobotSimulation(mixed,worlds[0]!);expect(robot.step().ledSecondaryDuty).toBe(33.3);const final=robot.step();expect(final.ledDuty).toBe(100);expect(final.ledSecondaryDuty).toBe(0);
});
it('parameterized PWM calls execute by value and reject invalid evaluated duties',()=>{
 const program:FunctionProgram={setup:[{kind:'call',name:'duty',arguments:[number(12.5)]}],loop:[],functions:[{name:'duty',parameters:['percent'],body:[{kind:'pwm',channel:2,value:{kind:'variable',name:'percent'}}]}]};
 expect(interpretFunctions(program,0)).toEqual([{timeMs:0,kind:'pwm',value:12.5,channel:2}]);expect(new RobotSimulation(program,worlds[0]!).step().ledSecondaryDuty).toBe(12.5);
 for(const value of [-1,100.1]){const bad:Program={setup:[{kind:'pwm',value:number(value)},{kind:'print',text:'unreachable'}],loop:[]};expect(()=>interpret(bad,0)).toThrow('PWM_RANGE');const state=new RobotSimulation(bad,worlds[0]!).step();expect(state.error).toContain('PWM_RANGE');expect(state.log).toEqual([]);expect(state.ledDuty).toBe(0);program.setup=[{kind:'call',name:'duty',arguments:[number(value)]}];expect(()=>interpretFunctions(program,0)).toThrow('PWM_RANGE');}
 const invalid={setup:[{kind:'pwm',channel:3,value:number(0)}],loop:[]} as unknown as Program;expect(()=>validateProgram(invalid)).toThrow('INDICATOR_INVALID');expect(()=>generate({setup:[{kind:'pwm',value:number(50)}],loop:[]},2)).toThrow('PWM_DRIVER_REQUIRED');expect(()=>generate({setup:[{kind:'pwm',value:number(50)}],loop:[]},null)).toThrow('WIRING_UNASSIGNED');
});
