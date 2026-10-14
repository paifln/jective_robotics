import {z} from 'zod';
export const KnowledgeRequestSchema=z.object({lessonId:z.string().regex(/^L(?:0[1-9]|[1-5]\d|60)$/),choice:z.number().int().min(0).max(2).nullable(),input:z.string().max(128)}).strict();
export type KnowledgeRequest=z.infer<typeof KnowledgeRequestSchema>;
export const KnowledgeResultSchema=z.object({choiceCorrect:z.boolean(),numberCorrect:z.boolean(),score:z.number().int().min(0).max(2),total:z.literal(2),passed:z.boolean()}).strict().refine(result=>result.passed===(result.choiceCorrect&&result.numberCorrect)&&result.score===Number(result.choiceCorrect)+Number(result.numberCorrect));
export type KnowledgeResult=z.infer<typeof KnowledgeResultSchema>;
