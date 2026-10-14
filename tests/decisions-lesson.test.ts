import type {FunctionProgram} from '../packages/codegen/functions';
import {it,expect} from 'vitest';
import {artifacts} from '../packages/content/lessons';
import {RobotSimulation,worlds,type World} from '../packages/simulator';
import type {Program} from '../packages/codegen';
const scene=(button:boolean,near:boolean):World=>({...structuredClone(worlds[0]!),inputs:{button},obstacles:[{x:near?1:2.5,y:1,width:.2,height:1}]});
const configure=(program:Program|FunctionProgram,manual:boolean)=>{
 const result=structuredClone(program);for(const i of result.setup)if(i.kind==='set'&&i.name==='indicator_manual')i.value={kind:'number',value:Number(manual)};return result;
};
it('L09 reference passes every independent decision-table row with actual model button and ray inputs',()=>{
 for(const button of [false,true])for(const near of [false,true])for(const manual of [false,true]){
  const expected=(button&&!near)||manual;
  const state=new RobotSimulation(configure(artifacts.L09!.reference,manual),scene(button,near)).step();
  expect(state.variables.button_pressed).toBe(Number(button));expect(state.variables.near).toBe(Number(near));
  expect(state.led).toBe(expected);expect(state.log[0]).toBe('0 ms: NOTICE_'+(expected?'ON':'OFF'));
  expect(state.pose).toEqual(worlds[0]!.start);expect(state.error).toBeNull();
 }
});
it('L09 intentionally wrong operator fails released/far and pressed/near counterexamples',()=>{
 for(const [button,near] of [[false,false],[true,true]] as const){
  expect(new RobotSimulation(configure(artifacts.L09!.starter,false),scene(button,near)).step().led).toBe(true);
  expect(new RobotSimulation(configure(artifacts.L09!.reference,false),scene(button,near)).step().led).toBe(false);
 }
});
