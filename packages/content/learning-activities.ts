import {demonstrationFromAnswers,reviewDemonstration} from './final-demonstration';
import {documentationFromAnswers,reviewDocumentation} from './technical-documentation';
import {proposalFromAnswers,reviewCapstoneProposal} from './capstone-proposal';
import {communicationFromAnswers,reviewCommunicationRecord} from './communication-record';
import {z} from 'zod';
import type {StudentText} from './student-theory';
import {matrixFromAnswers,reviewRequirementMatrix} from './requirement-matrix';
export const copy=(en:string,ru:string,kk:string):StudentText=>({en,ru,kk});
export type LearningItem={id:string;label:StudentText};
type Base={id:string;prompt:StudentText;hint:StudentText;explanation:StudentText};
export type LearningActivity=Base&({kind:'select';items:LearningItem[];correct:string[]}|{kind:'match';items:LearningItem[];categories:LearningItem[];correct:Record<string,string>}|{kind:'order';items:LearningItem[];correct:string[]}|{kind:'number';unit:StudentText;expected:number;tolerance:number}|{kind:'reflect';criteria:StudentText[]}|{kind:'requirement-matrix'}|{kind:'communication-record'}|{kind:'capstone-proposal'}|{kind:'technical-documentation'}|{kind:'final-demonstration'});
export const LearnerAnswersSchema=z.record(z.string().regex(/^[a-z][a-z0-9_-]{0,49}$/),z.union([z.string().max(3000),z.array(z.string().max(80)).max(30)])).refine(v=>Object.keys(v).length<=30,'ANSWER_LIMIT');
export type LearnerAnswers=z.infer<typeof LearnerAnswersSchema>;
export type LearningGrade={state:'incomplete'|'needs-practice'|'checked'|'self-reported';correct:number;total:number};
export function gradeActivity(activity:LearningActivity,value:unknown):LearningGrade{
 const answers=LearnerAnswersSchema.parse(value);let correct=0,total=1,complete=false;
 if(activity.kind==='final-demonstration'){const review=reviewDemonstration(demonstrationFromAnswers(answers));return {state:review.state,correct:0,total:0};}if(activity.kind==='technical-documentation'){const review=reviewDocumentation(documentationFromAnswers(answers));return {state:review.state,correct:0,total:0};}if(activity.kind==='capstone-proposal'){const review=reviewCapstoneProposal(proposalFromAnswers(answers));return {state:review.state,correct:0,total:0};}if(activity.kind==='communication-record'){const review=reviewCommunicationRecord(communicationFromAnswers(answers));return {state:review.state,correct:0,total:0};}if(activity.kind==='requirement-matrix'){const review=reviewRequirementMatrix(matrixFromAnswers(answers));return {state:review.state,correct:0,total:0};}
 if(activity.kind==='select'){const selected=answers.selection;complete=Array.isArray(selected)&&selected.length>0;correct=Array.isArray(selected)&&complete&&new Set(selected).size===selected.length&&selected.length===activity.correct.length&&activity.correct.every(id=>selected.includes(id))?1:0;}
 else if(activity.kind==='order'){const order=answers.order;complete=Array.isArray(order)&&order.length===activity.items.length;correct=Array.isArray(order)&&complete&&activity.correct.every((id,i)=>order[i]===id)?1:0;}
 else if(activity.kind==='match'){total=activity.items.length;complete=activity.items.every(item=>typeof answers[item.id]==='string'&&answers[item.id]!=='');correct=activity.items.filter(item=>answers[item.id]===activity.correct[item.id]).length;}
 else if(activity.kind==='number'){const raw=answers.number;complete=typeof raw==='string'&&raw.trim()!=='';const n=typeof raw==='string'&&complete?Number(raw.replace(',','.')):NaN;correct=Number.isFinite(n)&&Math.abs(n-activity.expected)<=activity.tolerance?1:0;}
 else {const response=answers.reflection;complete=typeof response==='string'&&response.trim().length>=20;return {state:complete?'self-reported':'incomplete',correct:0,total:0};}
 return {state:!complete?'incomplete':correct===total?'checked':'needs-practice',correct,total};
}
