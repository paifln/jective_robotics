import type {Assignment,Project,Submission} from '../contracts';
import {createReviewWork} from './index';
/** Versioning is scoped to an assignment and a pseudonymous learner, never a project filename. */
export function prepareReviewSubmission({assignment,project,learner,evidence,previous,current,id,submittedAt}:{assignment:Assignment;project:Project;learner:string;evidence:string;previous:Submission[];current?:Submission;id:string;submittedAt:string}){
 const learnerId=learner.trim();const versions=previous.filter(row=>row.assignmentId===assignment.id&&row.learnerId===learnerId).map(row=>row.version);
 const capturedVersion=current?.assignmentId===assignment.id&&current.learnerId===learnerId?current.version:0;
 return createReviewWork(assignment,{schemaVersion:1,id,assignmentId:assignment.id,learnerId,version:Math.max(0,...versions,capturedVersion)+1,project:structuredClone(project),evidence:[{kind:'self-reported',description:evidence.trim()}],submittedAt});
}
