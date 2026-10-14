import {it,expect} from 'vitest';
import * as Blockly from 'blockly';
import {programWorkspace,toFunctionProgram} from '../apps/desktop/renderer/blocks';
import {localizeBlocks} from '../apps/desktop/renderer/block-locale';
import {functionsArtifact} from '../packages/content/lesson-functions';
it('Blockly language changes preserve serialized programs, IDs, parameters and selected dropdown values',()=>{
 const workspace=new Blockly.Workspace();try{
  Blockly.serialization.workspaces.load(programWorkspace(functionsArtifact.reference),workspace);const before=Blockly.serialization.workspaces.save(workspace),program=toFunctionProgram(workspace);
  for(const locale of ['ru','kk','en'] as const){localizeBlocks(workspace,locale);localizeBlocks(workspace,locale);expect(Blockly.serialization.workspaces.save(workspace)).toEqual(before);expect(toFunctionProgram(workspace)).toEqual(program);const definition=workspace.getAllBlocks(false).find(b=>b.type==='jective_function')!;expect(definition.toString()).toContain(locale==='ru'?'параметры':locale==='kk'?'параметрлер':'parameters');const indicator=workspace.getAllBlocks(false).find(b=>b.type==='jective_led')!;expect(indicator.getFieldValue('STATE')).toBe('ON');expect(indicator.toString()).toContain(locale==='ru'?'ВКЛ':locale==='kk'?'ҚОСУЛЫ':'ON');}
 }finally{workspace.dispose();}
});
it('localized dropdowns retain real undo and redo history',async()=>{
 const workspace=new Blockly.Workspace();try{
  Blockly.serialization.workspaces.load(programWorkspace(functionsArtifact.reference),workspace);await new Promise(resolve=>setTimeout(resolve,20));workspace.clearUndo();
  const indicator=workspace.getAllBlocks(false).find(b=>b.type==='jective_led')!;indicator.setFieldValue('OFF','STATE');await new Promise(resolve=>setTimeout(resolve,20));const history=[...workspace.getUndoStack()];expect(history.length).toBeGreaterThan(0);
  localizeBlocks(workspace,'ru');localizeBlocks(workspace,'kk');expect(workspace.getUndoStack()).toEqual(history);workspace.undo(false);expect(indicator.getFieldValue('STATE')).toBe('ON');workspace.undo(true);expect(indicator.getFieldValue('STATE')).toBe('OFF');
 }finally{workspace.dispose();}
});
