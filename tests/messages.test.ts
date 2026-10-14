import {it,expect} from 'vitest';
import {artifacts} from '../packages/content/lessons';
import {interpret} from '../packages/simulator';
import {generate} from '../packages/codegen';
it('L05 reference emits the predicted startup and phase evidence without motor instructions',()=>{
 const program=artifacts.L05!.reference;
 expect(interpret(program,1250).slice(0,5)).toEqual([
  {timeMs:0,kind:'print',value:'SIMULATION START'},
  {timeMs:0,kind:'print',value:'PHASE_A'},
  {timeMs:250,kind:'print',value:'PHASE_B'},
  {timeMs:1000,kind:'print',value:'PHASE_A'},
  {timeMs:1250,kind:'print',value:'PHASE_B'}
 ]);
 const source=generate(program,null);expect(source).toContain('Serial.println("PHASE_A")');expect(source).not.toContain('digitalWrite');
});
