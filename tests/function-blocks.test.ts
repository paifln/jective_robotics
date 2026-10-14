import {it,expect} from 'vitest';
import * as Blockly from 'blockly';
import {programWorkspace,toFunctionProgram,toProgram} from '../apps/desktop/renderer/blocks';
import {generateStudio} from '../packages/codegen';
import {interpretFunctions} from '../packages/simulator/functions';
import type {FunctionProgram} from '../packages/codegen/functions';
const clean=(value:unknown)=>JSON.parse(JSON.stringify(value,(key,value)=>key==='blockId'?undefined:value));
it('all supported arities survive actual Blockly serialization and execute after restoration',()=>{
 for(let count=0;count<=8;count++){
  const parameters=Array.from({length:count},(_,index)=>'p'+index);
  const program:FunctionProgram={setup:[{kind:'call',name:'f',arguments:parameters.map((_,index)=>({kind:'number',value:index+1}))}],loop:[],functions:[{name:'f',parameters,body:[{kind:'print',text:'called'},...(count?[{kind:'waitValue' as const,value:{kind:'variable' as const,name:parameters[count-1]!}}]:[])]}]};
  const workspace=new Blockly.Workspace(),restored=new Blockly.Workspace();try{
   Blockly.serialization.workspaces.load(programWorkspace(program),workspace);expect(clean(toFunctionProgram(workspace))).toEqual(program);
   Blockly.serialization.workspaces.load(Blockly.serialization.workspaces.save(workspace),restored);const parsed=toFunctionProgram(restored);expect(clean(parsed)).toEqual(program);expect('functions' in parsed).toBe(true);expect(interpretFunctions(parsed as FunctionProgram,10)[0]!.value).toBe('called');expect(generateStudio(parsed,null)).toContain('void jf_f(');expect(()=>toProgram(restored)).toThrow('FUNCTION_PROGRAM_REQUIRED');
  }finally{workspace.dispose();restored.dispose();}
 }
});
it('rejects malformed function definitions, recursive calls and undefined calls in the editor',()=>{
 const workspace=new Blockly.Workspace();try{
  const definition=workspace.newBlock('jective_function');definition.setFieldValue('f','NAME');definition.setFieldValue('x, x','PARAMETERS');expect(()=>toFunctionProgram(workspace)).toThrow('FUNCTION_PARAMETERS');
  definition.setFieldValue('x;bad','PARAMETERS');expect(()=>toFunctionProgram(workspace)).toThrow('FUNCTION_PARAMETERS');
  definition.setFieldValue('','PARAMETERS');const call=workspace.newBlock('jective_call_0');call.setFieldValue('f','NAME');definition.getInput('DO')!.connection!.connect(call.previousConnection!);expect(()=>toFunctionProgram(workspace)).toThrow('FUNCTION_RECURSION');
  call.setFieldValue('missing','NAME');expect(()=>toFunctionProgram(workspace)).toThrow('FUNCTION_UNKNOWN');
 }finally{workspace.dispose();}
});
