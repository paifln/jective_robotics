import {ProjectSchema,type Project} from '../contracts';
import {sameSourceInputs,SourceFileNameSchema} from '../contracts/source-files';
export interface CodeReview {project:Project;file:string;original:string}
export function sourceForReview(project:Project,file:string):string {
 if(file==='sketch.ino')return project.source;
 SourceFileNameSchema.parse(file);
 const source=project.sourceFiles?.[file];if(source===undefined)throw new Error('REVIEW_FILE_MISSING');return source;
}
/** Capture an immutable validated source/profile snapshot, not just a matching text. */
export function captureCodeReview(project:Project,file:string):CodeReview {
 const snapshot=ProjectSchema.parse(project);return {project:snapshot,file,original:sourceForReview(snapshot,file)};
}
export function reviewStillCurrent(project:Project,review:CodeReview):boolean {
 const old=review.project;
 return project.id===old.id&&project.mode===old.mode&&sameSourceInputs(project,old)&&project.profileId===old.profileId&&project.profileVersion===old.profileVersion&&project.profileHash===old.profileHash&&JSON.stringify(project.profileDefinition)===JSON.stringify(old.profileDefinition)&&JSON.stringify(project.wiring)===JSON.stringify(old.wiring);
}
/** The caller makes an independent Code copy before replacing a Blocks sketch. */
export function replaceReviewedFile(project:Project,file:string,source:string):Project {
 sourceForReview(project,file);
 return ProjectSchema.parse(file==='sketch.ino'?{...project,mode:'code',source}:{...project,sourceFiles:{...project.sourceFiles,[file]:source}});
}
export function reviewContext(review:CodeReview,share:boolean):string {
 if(!share)return '';
 const header='Selected source file: '+review.file+'\n';
 return header+review.original.slice(0,35000-header.length);
}

/** A review record is source inspection, never compiler or physical evidence. */
export function codeReviewRecord(review:CodeReview,candidate:string,decision:'inspect'|'reject') {
 const proposed=replaceReviewedFile(review.project,review.file,candidate);
 return {schemaVersion:1,kind:'assistant-source-review',decision,file:review.file,
  original:review.original,proposed:sourceForReview(proposed,review.file),
  verification:{sourceInspection:'recorded',compilation:'NOT RUN',upload:'NOT RUN',physical:'NOT RUN'}} as const;
}
