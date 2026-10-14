import * as monaco from 'monaco-editor';
import type {Project} from '../../../packages/contracts';
import {sortedSourceFiles} from '../../../packages/contracts/source-files';
type ModelState={model:monaco.editor.ITextModel;view:monaco.editor.ICodeEditorViewState|null};
/** One bounded set of models per project; switching files preserves undo and view. */
export class ProjectCodeEditor {
 private projectId='';private active='sketch.ino';private syncing=false;private models=new Map<string,ModelState>();private subscription:monaco.IDisposable;
 constructor(private editor:monaco.editor.IStandaloneCodeEditor,private changed:(projectId:string,file:string,text:string)=>void){
  const initial=editor.getModel();editor.setModel(null);initial?.dispose();this.subscription=editor.onDidChangeModelContent(()=>{if(!this.syncing)this.changed(this.projectId,this.active,editor.getValue());});
 }
 private activate(file:string){
  const next=this.models.get(file);if(!next)return;
  if(this.editor.getModel()!==next.model){const previous=this.models.get(this.active);if(previous){previous.model.pushStackElement();previous.view=this.editor.saveViewState();}this.active=file;this.editor.setModel(next.model);next.model.pushStackElement();if(next.view)this.editor.restoreViewState(next.view);}
  this.editor.getDomNode()?.setAttribute('data-file',file);this.editor.getDomNode()?.setAttribute('data-source',next.model.getValue());
 }
 sync(project:Project,requested:string){
  this.syncing=true;try{
   const fresh=this.projectId!==project.id;if(fresh){this.editor.setModel(null);for(const state of this.models.values())state.model.dispose();this.models.clear();this.projectId=project.id;this.active='sketch.ino';}
   const entries:[string,string][]=[['sketch.ino',project.source],...sortedSourceFiles(project.sourceFiles)],names=new Set(entries.map(([name])=>name));
   for(const [name,text]of entries){let state=this.models.get(name);if(!state){state={model:monaco.editor.createModel(text,'cpp',monaco.Uri.parse('jective-project://'+project.id+'/'+name)),view:null};this.models.set(name,state);}else if(state.model.getValue()!==text){state.model.pushStackElement();state.model.pushEditOperations([],[{range:state.model.getFullModelRange(),text}],()=>null);state.model.pushStackElement();}}
   const file=fresh||!names.has(requested)?'sketch.ino':requested;this.activate(file);
   for(const [name,state]of this.models){if(!names.has(name)){state.model.dispose();this.models.delete(name);}}
   this.editor.updateOptions({readOnly:project.mode==='blocks'});
   if(fresh&&project.mode==='code'){const line=project.source.split('\n').findIndex(text=>text.includes('// STUDENT TASK'))+1;if(line>0){this.editor.setPosition({lineNumber:line,column:1});requestAnimationFrame(()=>{if(this.projectId===project.id&&this.active==='sketch.ino'){this.editor.layout();this.editor.revealLineInCenter(line);}});}}
   return file;
  }finally{this.syncing=false;}
 }
 navigate(file:string,line:number,column:number){this.syncing=true;try{this.activate(file);this.editor.layout();this.editor.setPosition({lineNumber:line,column});this.editor.revealLineInCenter(line);this.editor.focus();}finally{this.syncing=false;}}
 dispose(){this.subscription.dispose();this.editor.setModel(null);for(const state of this.models.values())state.model.dispose();this.models.clear();}
}
