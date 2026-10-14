import {it,expect} from 'vitest';
import * as Blockly from 'blockly';
import {programWorkspace,toProgram} from '../apps/desktop/renderer/blocks';
import {interpret,RobotSimulation,worlds} from '../packages/simulator';
import {validateProgram,type Expression,type Program} from '../packages/codegen';
it('NOT survives Blockly and treats zero as false and nonzero as true in both simulators',()=>{
 for(const [input,expected] of [[0,'true'],[1,'false'],[-2,'false'],[.5,'false']]){
  const program:Program={setup:[{kind:'if',condition:{kind:'not',value:{kind:'number',value:input as number}},then:[{kind:'print',text:'true'}],otherwise:[{kind:'print',text:'false'}]}],loop:[]};
  const workspace=new Blockly.Workspace();try{
   Blockly.serialization.workspaces.load(programWorkspace(program),workspace);const restored=toProgram(workspace);
   expect(interpret(restored,0)[0]?.value).toBe(expected);
   expect(new RobotSimulation(restored,worlds[0]!).step().log[0]).toBe('0 ms: '+expected);
  }finally{workspace.dispose();}
 }
});
it('NOT preserves operand errors and remains subject to the expression nesting bound',()=>{
 let expression:Expression={kind:'number',value:0};for(let n=0;n<26;n++)expression={kind:'not',value:expression};
 expect(()=>validateProgram({setup:[{kind:'set',name:'result',value:expression}],loop:[]})).toThrow('EXPRESSION_LIMIT');
 const program:Program={setup:[{kind:'set',name:'result',value:{kind:'not',value:{kind:'binary',op:'/',left:{kind:'number',value:1},right:{kind:'number',value:0}}}}],loop:[]};
 expect(()=>interpret(program,0)).toThrow('DIVISION_BY_ZERO');
 const state=new RobotSimulation(program,worlds[0]!).step();expect(state.error).toContain('DIVISION_BY_ZERO');expect(state.variables.result).toBeUndefined();
});
