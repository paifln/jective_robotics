import {describe,it,expect} from 'vitest';
import {interpretFunctions} from '../packages/simulator/functions';
import type {FunctionProgram,FunctionInstruction} from '../packages/codegen/functions';
const number=(value:number)=>({kind:'number' as const,value});
const variable=(name:string)=>({kind:'variable' as const,name});
const call=(name:string,...values:number[]):FunctionInstruction=>({kind:'call',name,arguments:values.map(number)});
const program=(setup:FunctionInstruction[]):FunctionProgram=>({setup,loop:[],functions:[{name:'pulse',parameters:['ms'],body:[{kind:'led',on:true},{kind:'waitValue',value:variable('ms')},{kind:'led',on:false,channel:2}]}]});
describe('parameterized indicator execution',()=>{
 it('executes normal and boundary arguments at independent call sites',()=>{
  expect(interpretFunctions(program([call('pulse',0),call('pulse',100),call('pulse',60000)]),60100).map(e=>e.timeMs)).toEqual([0,0,0,100,100,60100]);
 });
 it('isolates parameters, restores callers and shares only globals',()=>{
  const p=program([{kind:'set',name:'ms',value:number(7)},call('outer',20),{kind:'waitValue',value:variable('ms')},{kind:'print',text:'done'}]);
  p.functions.push({name:'outer',parameters:['ms'],body:[call('pulse',3),{kind:'waitValue',value:variable('ms')},{kind:'set',name:'ms',value:number(99)},{kind:'set',name:'global',value:number(5)},call('reader')]},{name:'reader',parameters:[],body:[{kind:'waitValue',value:variable('ms')},{kind:'waitValue',value:variable('global')}]});
  expect(interpretFunctions(p,100).at(-1)).toEqual({timeMs:42,kind:'print',value:'done'});
 });
 it('bounds empty function calls and loops with one shared instruction budget',()=>{
  const p=program([]);p.functions.push({name:'empty',parameters:[],body:[]});p.loop=[call('empty')];
  expect(()=>interpretFunctions(p,100,10)).toThrow('SIM_INSTRUCTION_BUDGET');
  expect(()=>interpretFunctions(program([{kind:'repeat',count:1000,body:[]}]),0,20)).toThrow('SIM_INSTRUCTION_BUDGET');
  expect(()=>interpretFunctions(program([{kind:'while',condition:number(1),maxIterations:2,body:[]}]),0)).toThrow('LOOP_BUDGET');
 });
 it('supports branching, counters, loop termination and duration cutoff',()=>{
  const p=program([{kind:'set',name:'n',value:number(0)},{kind:'while',condition:{kind:'binary',op:'<',left:variable('n'),right:number(2)},maxIterations:2,body:[{kind:'set',name:'n',value:{kind:'binary',op:'+',left:variable('n'),right:number(1)}},{kind:'if',condition:variable('n'),then:[{kind:'print',text:'yes'}],otherwise:[{kind:'print',text:'no'}]}]},{kind:'if',condition:number(0),then:[],otherwise:[call('pulse',100),{kind:'print',text:'late'}]}]);
  expect(interpretFunctions(p,0).map(e=>e.value)).toEqual(['yes','yes',true]);
 });
 it('rejects argument faults, invalid waits and unsupported hardware expressions',()=>{
  expect(()=>interpretFunctions(program([call('pulse',-1)]),100)).toThrow('WAIT_RANGE');
  const p=program([{kind:'call',name:'pulse',arguments:[{kind:'binary',op:'/',left:number(1),right:number(0)}]}]);
  expect(()=>interpretFunctions(p,100)).toThrow('DIVISION_BY_ZERO');
  expect(()=>interpretFunctions(program([{kind:'waitValue',value:{kind:'sensor',sensor:'distance'}}]),100)).toThrow('sensor expressions');
  expect(()=>interpretFunctions(program([{kind:'drive',left:0,right:0}]),100)).toThrow('motion blocks');
  for(const duration of [-1,Infinity,3600001])expect(()=>interpretFunctions(program([]),duration)).toThrow('SIM_DURATION');
  for(const budget of [0,NaN,1.5])expect(()=>interpretFunctions(program([]),0,budget)).toThrow('SIM_INSTRUCTION_BUDGET');
 });
});
