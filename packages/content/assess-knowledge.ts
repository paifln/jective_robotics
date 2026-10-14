import {KnowledgeRequestSchema,KnowledgeResultSchema} from '../contracts/knowledge-check';
import {gradeKnowledge} from './knowledge-check';
export function assessKnowledge(value:unknown){const request=KnowledgeRequestSchema.parse(value);return {lessonId:request.lessonId,result:KnowledgeResultSchema.parse(gradeKnowledge(request.lessonId,request.choice,request.input))};}
