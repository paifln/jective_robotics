import {z} from 'zod';
/** A learner's proposal, not a hardware inventory or approved safety certificate. */
export const proposalFields=['mission','components','success','risks','simulation','physical','outofscope','nextstep'] as const;
const text=z.string().max(3000);
export const CapstoneProposalSchema=z.object({mission:text,components:text,success:text,risks:text,simulation:text,physical:text,outofscope:text,nextstep:text}).strict();
export type CapstoneProposal=z.infer<typeof CapstoneProposalSchema>;
export function emptyCapstoneProposal():CapstoneProposal{return {mission:'',components:'',success:'',risks:'',simulation:'',physical:'',outofscope:'',nextstep:''};}
export function proposalFromAnswers(value:unknown):CapstoneProposal{
 const answers=z.record(z.string(),text).refine(v=>Object.keys(v).every(k=>(proposalFields as readonly string[]).includes(k)),'UNKNOWN_PROPOSAL_FIELD').parse(value);
 return CapstoneProposalSchema.parse({...emptyCapstoneProposal(),...answers});
}
/** Presence checks only: human review must assess feasibility, units and safety. */
export function reviewCapstoneProposal(value:unknown){
 const proposal=CapstoneProposalSchema.parse(value),missing=proposalFields.filter(field=>proposal[field].trim().length<20);
 return {state:missing.length?'incomplete' as const:'self-reported' as const,missing,assessment:'human-review-required' as const};
}
export function exportCapstoneProposal(value:unknown){
 const proposal=CapstoneProposalSchema.parse(value);
 return {schemaVersion:1,lessonId:'L55',origin:'learner-authored',proposal,review:reviewCapstoneProposal(proposal),verification:{simulation:'NOT RUN by this proposal',compilation:'NOT RUN by this proposal',upload:'NOT RUN by this proposal',physical:'NOT RUN by this proposal'}} as const;
}
