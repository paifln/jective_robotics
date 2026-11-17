import {it,expect} from 'vitest';
import * as Blockly from 'blockly';
import {programWorkspace,toProgram} from '../apps/desktop/renderer/blocks';
import {generate,type Program} from '../packages/codegen';
const clean=(p:Program)=>JSON.parse(JSON.stringify(p,(k,v)=>k==='blockId'?undefined:v));
it('every shipping block and expression survives actual Blockly serialization with semantics intact',()=>{const p:Program={setup:[{kind:'set',name:'counter',value:{kind:'number',value:2}},{kind:'print',text:'Қазақша\n"quoted"'}],loop:[{kind:'repeat',count:3,body:[{kind:'if',condition:{kind:'binary',op:'>',left:{kind:'variable',name:'counter'},right:{kind:'number',value:1}},then:[{kind:'led',on:true},{kind:'drive',left:20,right:30}],otherwise:[{kind:'stop'}]},{kind:'wait',ms:40},{kind:'set',name:'sensorValue',value:{kind:'sensor',sensor:'distance'}}]}]};const workspace=new Blockly.Workspace();const restored=new Blockly.Workspace();try{Blockly.serialization.workspaces.load(programWorkspace(p),workspace);expect(clean(toProgram(workspace))).toEqual(p);const json=Blockly.serialization.workspaces.save(workspace);Blockly.serialization.workspaces.load(json,restored);expect(clean(toProgram(restored))).toEqual(p);expect(()=>generate(toProgram(restored),2)).toThrow('MOTOR_WIRING_REQUIRED');}finally{workspace.dispose();restored.dispose();}});
it('variables, arithmetic, if branches and repeats generate stable valid C++ and escaped identifiers',()=>{const p:Program={setup:[{kind:'set',name:'count',value:{kind:'number',value:1}}],loop:[{kind:'if',condition:{kind:'binary',op:'<',left:{kind:'variable',name:'count'},right:{kind:'number',value:4}},then:[{kind:'repeat',count:2,body:[{kind:'led',on:true},{kind:'wait',ms:100}]}],otherwise:[{kind:'print',text:'done'}]}]};const s=generate(p,2);expect(s).toContain('double jv_count');expect(s).toContain('return (j_a < j_b)');expect(s).toContain('jr_1<2');expect(generate(p,2)).toBe(s);expect(()=>generate({setup:[{kind:'set',name:'x;evil()',value:{kind:'number',value:0}}],loop:[]},2)).toThrow('VARIABLE_NAME');});

it('edits wait and sound in seconds while preserving the original workspace units',()=>{
 const program:Program={setup:[{kind:'wait',ms:500},{kind:'sound',frequencyHz:440,durationMs:200}],loop:[]};
 const workspace=new Blockly.Workspace();
 const restored=new Blockly.Workspace();
 try{
  Blockly.serialization.workspaces.load(programWorkspace(program),workspace);
  const wait=workspace.getBlocksByType('jective_wait',false)[0]!;
  const sound=workspace.getBlocksByType('jective_sound',false)[0]!;
  expect(wait.getFieldValue('MS')).toBe(0.5);
  expect(sound.getFieldValue('MS')).toBe(0.2);
  wait.setFieldValue(1.18,'MS');
  sound.setFieldValue(0.35,'MS');
  const json=Blockly.serialization.workspaces.save(workspace);
  expect(json.blocks.blocks[0].inputs.DO.block.fields.MS).toBe(1180);
  Blockly.serialization.workspaces.load(json,restored);
  expect(clean(toProgram(restored))).toEqual({setup:[{kind:'wait',ms:1180},{kind:'sound',frequencyHz:440,durationMs:350}],loop:[]});
 }finally{workspace.dispose();restored.dispose();}
});
