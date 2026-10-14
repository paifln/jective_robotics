import {it,expect} from 'vitest';
import {RobotSimulation,WorldSchema,worlds,type World} from '../packages/simulator';
import type {Program} from '../packages/codegen';
const program:Program={setup:[],loop:[{kind:'if',condition:{kind:'sensor',sensor:'button'},then:[{kind:'print',text:'PRESSED'}],otherwise:[{kind:'print',text:'RELEASED'}]},{kind:'wait',ms:20}]};
it('scheduled button values are applied before the first read at or after their timestamp',()=>{
 const world:World={...worlds[0]!,inputs:{button:true},buttonEvents:[{timeMs:0,pressed:false},{timeMs:20,pressed:true},{timeMs:21,pressed:false},{timeMs:39,pressed:true},{timeMs:60,pressed:false}]};
 const state=new RobotSimulation(program,WorldSchema.parse(JSON.parse(JSON.stringify(world)))).step(4);expect(state.log).toEqual(['0 ms: RELEASED','20 ms: PRESSED','40 ms: PRESSED','60 ms: RELEASED']);
 const traces=Array.from({length:10},()=>new RobotSimulation(program,world).step(4));for(const trace of traces)expect(trace).toEqual(state);
});
it('events retain the initial value until scheduled and consume all changes during a wait',()=>{
 const world:World={...worlds[0]!,inputs:{button:true},buttonEvents:[{timeMs:30,pressed:false},{timeMs:50,pressed:true},{timeMs:70,pressed:false}]};
 const slower:Program={setup:[],loop:[{kind:'if',condition:{kind:'sensor',sensor:'button'},then:[{kind:'print',text:'PRESSED'}],otherwise:[{kind:'print',text:'RELEASED'}]},{kind:'wait',ms:100}]};
 expect(new RobotSimulation(slower,world).step(6).log).toEqual(['0 ms: PRESSED','100 ms: RELEASED']);
 expect(new RobotSimulation(program,{...worlds[0]!,buttonEvents:[]}).step().log).toEqual(['0 ms: RELEASED']);
});
it('rejects ambiguous, unsorted, malformed and oversized event timelines',()=>{
 for(const buttonEvents of [[{timeMs:20,pressed:true},{timeMs:20,pressed:false}],[{timeMs:40,pressed:true},{timeMs:20,pressed:false}],[{timeMs:-1,pressed:true}],[{timeMs:.5,pressed:true}],[{timeMs:120000,pressed:true}],[{timeMs:0,pressed:1}],[{timeMs:0,pressed:true,physical:true}],Array.from({length:2001},(_,timeMs)=>({timeMs,pressed:false}))]){
  expect(WorldSchema.safeParse({...worlds[0]!,buttonEvents}).success).toBe(false);expect(()=>new RobotSimulation(program,{...worlds[0]!,buttonEvents} as World)).toThrow();
 }
});
