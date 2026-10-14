import {z} from 'zod';
import {AssignmentSchema,SubmissionSchema,GradeSchema} from './index';
export const ReviewAssignmentSchema=AssignmentSchema.superRefine((assignment,ctx)=>{
 const ids=assignment.rubric.map(row=>row.id);
 if(!ids.length||new Set(ids).size!==ids.length||ids.some(id=>!/^[a-z][a-z0-9_-]{0,49}$/.test(id)))ctx.addIssue({code:'custom',message:'REVIEW_RUBRIC_INVALID'});
 if(!assignment.title.trim()||!assignment.instructions.trim()||assignment.rubric.some(row=>!row.title.trim()))ctx.addIssue({code:'custom',message:'REVIEW_BRIEF_INCOMPLETE'});
 if(!assignment.permittedProfiles.length||new Set(assignment.permittedProfiles).size!==assignment.permittedProfiles.length||assignment.starter&&!assignment.permittedProfiles.includes(assignment.starter.profileId))ctx.addIssue({code:'custom',message:'REVIEW_PROFILES_INVALID'});
 if(assignment.dueDate&&!z.iso.date().safeParse(assignment.dueDate).success)ctx.addIssue({code:'custom',message:'REVIEW_DATE_INVALID'});
});
export const ReviewWorkSchema=z.object({schemaVersion:z.literal(1),assignment:ReviewAssignmentSchema,submission:SubmissionSchema,contextHash:z.string().regex(/^[a-f0-9]{64}$/)}).strict().superRefine((work,ctx)=>{
 if(work.assignment.id!==work.submission.assignmentId)ctx.addIssue({code:'custom',message:'REVIEW_ASSIGNMENT_MISMATCH'});
 if(!work.assignment.permittedProfiles.includes(work.submission.project.profileId))ctx.addIssue({code:'custom',message:'REVIEW_PROFILE_NOT_PERMITTED'});
});
export type ReviewWork=z.infer<typeof ReviewWorkSchema>;
export const ReviewFeedbackSchema=z.object({schemaVersion:z.literal(1),work:ReviewWorkSchema,grade:GradeSchema,reviewer:z.string().trim().min(1).max(80),reviewedAt:z.iso.datetime(),identity:z.literal('unverified-local-file')}).strict().superRefine((feedback,ctx)=>{
 if(feedback.grade.submissionId!==feedback.work.submission.id)ctx.addIssue({code:'custom',message:'REVIEW_SUBMISSION_MISMATCH'});
 const rubric=feedback.work.assignment.rubric,keys=Object.keys(feedback.grade.scores);if(keys.length!==rubric.length||keys.some(id=>!rubric.some(row=>row.id===id))||rubric.some(row=>feedback.grade.scores[row.id]===undefined||feedback.grade.scores[row.id]!>row.maxScore))ctx.addIssue({code:'custom',message:'REVIEW_SCORES_INVALID'});
});
export type ReviewFeedback=z.infer<typeof ReviewFeedbackSchema>;
export const ReviewArchiveSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('assignment'),value:ReviewAssignmentSchema}).strict(),
 z.object({kind:z.literal('review-work'),value:ReviewWorkSchema}).strict(),
 z.object({kind:z.literal('review-feedback'),value:ReviewFeedbackSchema}).strict()
]);
export type ReviewArchive=z.infer<typeof ReviewArchiveSchema>;
