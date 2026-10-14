import {it,expect} from 'vitest';
import {interpret,RobotSimulation,worlds} from '../packages/simulator';
import {generate,type Program,type Expression} from '../packages/codegen';
const dividedByZero:Expression={kind:'binary',op:'/',left:{kind:'number',value:1},right:{kind:'number',value:0}};
it('simulators report the first operand error before considering a second failing operand',()=>{
 const overflow:Expression={kind:'binary',op:'*',left:{kind:'number',value:1e308},right:{kind:'number',value:1e308}};
 for(const op of ['+','/','<','&&','||'] as const)for(const leftFirst of [true,false]){
  const error=leftFirst?'DIVISION_BY_ZERO':'EXPRESSION_RANGE';
  const program:Program={setup:[{kind:'set',name:'result',value:{kind:'binary',op,left:leftFirst?dividedByZero:overflow,right:leftFirst?overflow:dividedByZero}}],loop:[]};
  expect(()=>interpret(program,0)).toThrow(error);
  const state=new RobotSimulation(program,worlds[0]!).step();expect(state.error).toContain(error);expect(state.variables.result).toBeUndefined();
 }
});
it('both simulators reject evaluated division errors and overflow even when nested inside a comparison',()=>{
 const overflow:Expression={kind:'binary',op:'*',left:{kind:'number',value:1e308},right:{kind:'number',value:1e308}};
 for(const [expression,error] of [[dividedByZero,'DIVISION_BY_ZERO'],[overflow,'EXPRESSION_RANGE']] as const){
  for(const value of [expression,{kind:'binary' as const,op:'>' as const,left:expression,right:{kind:'number' as const,value:0}}]){
   const program:Program={setup:[{kind:'set',name:'result',value}],loop:[]};
   expect(()=>interpret(program,0)).toThrow(error);
   const state=new RobotSimulation(program,worlds[0]!).step();
   expect(state.status).toBe('error');expect(state.error).toContain(error);
   expect(state.variables.result).toBeUndefined();
  }
 }
});
it('both simulators short-circuit logical expressions like generated C++',()=>{
 for(const [op,value,expected] of [['&&',0,'false'],['||',1,'true']] as const){
  const program:Program={setup:[{kind:'if',condition:{kind:'binary',op,left:{kind:'number',value},right:dividedByZero},then:[{kind:'print',text:'true'}],otherwise:[{kind:'print',text:'false'}]}],loop:[]};
  expect(interpret(program,0)[0]!.value).toBe(expected);const state=new RobotSimulation(program,worlds[0]!).step();expect(state.status).toBe('completed');expect(state.log[0]).toContain(expected);
 }
});
it('generated number literals use floating-point division and comparison in the double-valued IR',()=>{
 const program:Program={setup:[{kind:'set',name:'fraction',value:{kind:'binary',op:'/',left:{kind:'number',value:1},right:{kind:'number',value:2}}}],loop:[]};
 expect(generate(program,null)).toContain('j_div(j_a, j_b)');expect(new RobotSimulation(program,worlds[0]!).step().variables.fraction).toBe(.5);
});
