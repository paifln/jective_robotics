import {ProjectSchema,type Project} from '../contracts';
import type {SourceFiles} from '../contracts/source-files';
/** Preserve complete code bundles and the learner's resolved hardware selection. */
export function createCodeLessonProject(previous:Project,id:string,source:string,sourceFiles:SourceFiles|undefined,projectId:string,name:string):Project {
 if(!/^L\d{2}$/.test(id))throw new Error('CODE_LESSON_ID_INVALID');
 return ProjectSchema.parse({schemaVersion:1,id:projectId,name,profileId:previous.profileId,profileDefinition:previous.profileDefinition,profileVersion:previous.profileVersion,profileHash:previous.profileHash,wiring:previous.wiring,mode:'code',source,sourceFiles,workspace:{},revision:0,lessonId:id});
}
