import * as Blockly from 'blockly';

/** Deserialise into an isolated headless workspace before touching the visible editor. */
export function preflightProjectWorkspace(value:Record<string,unknown>){
 const probe=new Blockly.Workspace();
 try{Blockly.serialization.workspaces.load(structuredClone(value),probe);}
 catch{throw new Error('PROJECT_WORKSPACE_INVALID');}
 finally{probe.dispose();}
}
