import {it,expect} from 'vitest';
import {RobotSimulation,worlds} from '../packages/simulator';
import type {FunctionProgram} from '../packages/codegen/functions';
const number=(value:number)=>({kind:'number' as const,value});
const variable=(name:string)=>({kind:'variable' as const,name});
it('robot calls preserve parameter frames across ticks and nested waits',()=>{
 const program:FunctionProgram={setup:[{kind:'set',name:'ms',value:number(7)},{kind:'call',name:'outer',arguments:[number(40)]},{kind:'set',name:'globalAfter',value:variable('ms')}],loop:[],functions:[{name:'outer',parameters:['ms'],body:[{kind:'call',name:'pulse',arguments:[number(20)]},{kind:'waitValue',value:variable('ms')},{kind:'set',name:'ms',value:number(99)},{kind:'set',name:'result',value:variable('ms')}]},{name:'pulse',parameters:['ms'],body:[{kind:'led',on:true},{kind:'waitValue',value:variable('ms')},{kind:'led',on:false,channel:2}]}]};
 const simulation=new RobotSimulation(program,worlds[0]!);expect(simulation.step().status).toBe('running');const end=simulation.step(10);expect(end.status).toBe('completed');expect(end.variables).toEqual({ms:7,result:99,globalAfter:7});expect(end.led).toBe(true);expect(end.ledSecondary).toBe(false);
});
it('function expressions read actual world inputs and motion remains a simulated intent',()=>{
 const program:FunctionProgram={setup:[{kind:'call',name:'act',arguments:[{kind:'sensor',sensor:'button'}]}],loop:[],functions:[{name:'act',parameters:['pressed'],body:[{kind:'if',condition:variable('pressed'),then:[{kind:'drive',left:30,right:30},{kind:'wait',ms:100},{kind:'stop'}],otherwise:[{kind:'print',text:'idle'}]}]}]};
 const idle=new RobotSimulation(program,worlds[0]!).step(20);expect(idle.log[0]).toContain('idle');
 const active=new RobotSimulation(program,{...worlds[0]!,inputs:{button:true}}).step(20);expect(active.status).toBe('completed');expect(active.pose.x).toBeGreaterThan(worlds[0]!.start.x);expect(active.left).toBeCloseTo(0,12);
});
it('empty repeated calls are bounded and callee faults stop robot motion',()=>{
 const program:FunctionProgram={setup:[],loop:[{kind:'call',name:'empty',arguments:[]}],functions:[{name:'empty',parameters:[],body:[]}]};
 expect(new RobotSimulation(program,worlds[0]!).step().error).toContain('SIM_INSTRUCTION_BUDGET');
 program.setup=[{kind:'call',name:'bad',arguments:[]}];program.loop=[];program.functions.push({name:'bad',parameters:[],body:[{kind:'drive',left:30,right:30},{kind:'waitValue',value:number(-1)}]});const state=new RobotSimulation(program,worlds[0]!).step();expect(state.error).toContain('WAIT_RANGE');expect(state.left).toBe(0);expect(state.right).toBe(0);
});
