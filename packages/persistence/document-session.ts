import {ProjectSchema,type Project} from '../contracts';

export type DocumentBinding=Readonly<{path:string;revision:number;fingerprint:string}>;
type Prepared={project:Project;signature:string;binding:DocumentBinding|null;persist:boolean};

/** Main-owned prepared documents; renderer acknowledgement never supplies a path. */
export class DocumentSession {
 private current:DocumentBinding|null=null;
 private pending:Prepared|null=null;
 private epoch=0;
 get version(){return this.epoch;}
 get binding(){return this.current;}
 clear(){this.epoch++;this.current=null;this.pending=null;}
 prepare(value:Project,binding:DocumentBinding|null,persist=false){
  const project=structuredClone(ProjectSchema.parse(value));
  this.pending={project,signature:JSON.stringify(project),binding:binding?Object.freeze({...binding}):null,persist};
  return structuredClone(project);
 }
 accept(value:unknown,persist:(project:Project)=>void){
  const project=ProjectSchema.parse(value),candidate=this.pending;
  if(!candidate||JSON.stringify(project)!==candidate.signature)throw new Error('PROJECT_OPEN_STALE');
  // A failed database write must not change the current external-file binding.
  if(candidate.persist)persist(candidate.project);
  this.current=candidate.binding;this.pending=null;this.epoch++;
  return candidate.project;
 }
 adoptSaved(binding:DocumentBinding,version:number){
  if(this.epoch!==version)return false;
  this.current=Object.freeze({...binding});this.pending=null;return true;
 }
}
