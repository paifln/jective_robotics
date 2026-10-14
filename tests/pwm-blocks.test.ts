import {it,expect} from 'vitest';
import * as Blockly from 'blockly';
import {programWorkspace,toFunctionProgram} from '../apps/desktop/renderer/blocks';
import {localizeBlocks} from '../apps/desktop/renderer/block-locale';
import {interpret} from '../packages/simulator';
import type {Program} from '../packages/codegen';
it('PWM expressions and channels survive Blockly persistence and language changes',()=>{
 const program:Program={setup:[{kind:'set',name:'percent',value:{kind:'number',value:12.5}},{kind:'pwm',value:{kind:'variable',name:'percent'}},{kind:'pwm',channel:2,value:{kind:'number',value:100}}],loop:[]};
 const workspace=new Blockly.Workspace(),restored=new Blockly.Workspace();try{
  Blockly.serialization.workspaces.load(programWorkspace(program),workspace);const before=Blockly.serialization.workspaces.save(workspace);for(const locale of ['ru','kk','en'] as const){localizeBlocks(workspace,locale);expect(Blockly.serialization.workspaces.save(workspace)).toEqual(before);}
  Blockly.serialization.workspaces.load(before,restored);const parsed=toFunctionProgram(restored);expect(JSON.parse(JSON.stringify(parsed,(key,value)=>key==='blockId'?undefined:value))).toEqual(program);expect(interpret(parsed,0)).toEqual([{timeMs:0,kind:'pwm',value:12.5},{timeMs:0,kind:'pwm',value:100,channel:2}]);
 }finally{workspace.dispose();restored.dispose();}
});
