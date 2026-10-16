import {it,expect} from 'vitest';
import * as Blockly from 'blockly';
import {programWorkspace} from '../apps/desktop/renderer/blocks';
import {preflightProjectWorkspace} from '../apps/desktop/renderer/project-preflight';
it('validates blocks in a separate workspace without changing a live editor or the input document',()=>{
 const live=new Blockly.Workspace();try{const state=programWorkspace({setup:[],loop:[{kind:'wait',ms:500}]});Blockly.serialization.workspaces.load(state,live);const original=JSON.stringify(Blockly.serialization.workspaces.save(live)),before=JSON.stringify(state);preflightProjectWorkspace(state);expect(JSON.stringify(state)).toBe(before);expect(JSON.stringify(Blockly.serialization.workspaces.save(live))).toBe(original);expect(()=>preflightProjectWorkspace({blocks:{languageVersion:0,blocks:[{type:'unknown_untrusted_block'}]}})).toThrow('PROJECT_WORKSPACE_INVALID');expect(JSON.stringify(Blockly.serialization.workspaces.save(live))).toBe(original);}finally{live.dispose();}
});
