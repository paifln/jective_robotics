import type {FunctionProgram} from '../packages/codegen/functions';
import {it,expect} from 'vitest';
import {artifacts} from '../packages/content/lessons';
import {interpret} from '../packages/simulator';
import {generate,type Program} from '../packages/codegen';
it('classroom timer exposes the starter defect and passes all three unequal/equal timing cases after repair',()=>{
 const starter=interpret(artifacts.L06!.starter,2000);expect(starter.filter(e=>e.kind==='led'&&!e.value)).toHaveLength(0);expect(starter.some(e=>e.value==='BREAK')).toBe(true);
 for(const [work,rest] of [[500,500],[600,400],[200,800]]){
  const program:Program|FunctionProgram=structuredClone(artifacts.L06!.reference);let first=true;
  for(const instruction of program.loop)if(instruction.kind==='wait'){instruction.ms=first?work!:rest!;first=false;}
  const trace=interpret(program,2000);expect(trace.filter(e=>e.kind==='print'&&e.value==='BREAK').map(e=>e.timeMs)).toEqual([work,1000+work!]);
  expect(trace.filter(e=>e.kind==='led'&&!e.value).map(e=>e.timeMs)).toEqual([work,1000+work!]);
  expect(trace.filter(e=>e.kind==='print'&&e.value==='WORK').map(e=>e.timeMs)).toEqual([0,1000,2000]);
  expect(generate(program,2)).toContain('digitalWrite(2, LOW)');
 }
});
