import {it,expect} from 'vitest';
import {RobotSimulation,WorldSchema,worlds} from '../packages/simulator';
import type {Program} from '../packages/codegen';
it('scenario button input is explicit, defaults released, and drives sensor decisions without physical data',()=>{
 const program:Program={setup:[{kind:'if',condition:{kind:'sensor',sensor:'button'},then:[{kind:'print',text:'pressed'}],otherwise:[{kind:'print',text:'released'}]}],loop:[]};
 for(const button of [undefined,false,true]){
  const world={...worlds[0]!,...(button!==undefined?{inputs:{button}}:{})};
  const restored=WorldSchema.parse(JSON.parse(JSON.stringify(world)));
  expect(new RobotSimulation(program,restored).step().log[0]).toBe('0 ms: '+(button?'pressed':'released'));
 }
 expect(WorldSchema.safeParse({...worlds[0]!,inputs:{button:1}}).success).toBe(false);
 expect(WorldSchema.safeParse({...worlds[0]!,inputs:{button:true,physical:true}}).success).toBe(false);
});
