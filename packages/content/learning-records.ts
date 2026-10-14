import {documentationFromAnswers,validateDocumentationUpdate} from './technical-documentation';
import {programmingActivities} from './programming-activities';
import {z} from 'zod';
import {LearnerAnswersSchema,gradeActivity} from './learning-activities';
import {foundationLessons} from './foundations';
export const LearningRecordSchema=z.object({answers:LearnerAnswersSchema,attempts:z.number().int().min(0).max(100000),state:z.enum(['draft','incomplete','needs-practice','checked','self-reported']),updatedAt:z.iso.datetime()}).strict();
export type LearningRecord=z.infer<typeof LearningRecordSchema>;
export const LearningIdSchema=z.enum(['F01','F02','F03','F04','F05','F06','F07','F08','L37','L38','L39','L40','L41','L42','L43','L44','L45','L46','L47','L48','L49','L50','L51','L52','L53','L54','L55','L56','L57','L58','L59','L60']);
export const LearningWriteSchema=z.object({id:LearningIdSchema,answers:LearnerAnswersSchema,check:z.boolean()}).strict();
export function parseLearningRecord(id:unknown,value:unknown):LearningRecord{const key=LearningIdSchema.parse(id);const record=LearningRecordSchema.parse(value);const activity=programmingActivities[key]??foundationLessons.find(l=>l.id===key)!.activity;if(record.state!=='draft'&&record.state!==gradeActivity(activity,record.answers).state)throw new Error('LEARNING_RECORD_STATE_INVALID');return record;}
export function nextLearningRecord(value:unknown,previous:LearningRecord|null):LearningRecord{const request=LearningWriteSchema.parse(value);if(request.id==='L59'&&previous)validateDocumentationUpdate(documentationFromAnswers(request.answers),documentationFromAnswers(previous.answers));const activity=programmingActivities[request.id]??foundationLessons.find(l=>l.id===request.id)!.activity;const grade=request.check||activity.kind==='requirement-matrix'||activity.kind==='communication-record'||activity.kind==='capstone-proposal'||activity.kind==='technical-documentation'||activity.kind==='final-demonstration'?gradeActivity(activity,request.answers):null;return LearningRecordSchema.parse({answers:request.answers,attempts:Math.min(100000,(previous?.attempts??0)+(request.check?1:0)),state:request.check?grade!.state:'draft',updatedAt:new Date().toISOString()});}

