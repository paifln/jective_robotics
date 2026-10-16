import {z} from 'zod';
export const BuildStageSchema=z.enum(['toolchain','environment-before','compile','environment-after','artifacts']);
export type BuildStage=z.infer<typeof BuildStageSchema>;
export const EnvironmentProgressSchema=z.object({files:z.number().int().min(0).max(100000),bytes:z.number().int().min(0).max(16*1024**3),elapsedMs:z.number().int().min(0).max(24*60*60*1000)}).strict();
export type EnvironmentProgress=z.infer<typeof EnvironmentProgressSchema>;
export const BuildStageEventSchema=z.object({projectId:z.uuid(),stage:BuildStageSchema,progress:EnvironmentProgressSchema.optional()}).strict().refine(event=>!event.progress||event.stage==='environment-before'||event.stage==='environment-after');
export type BuildStageEvent=z.infer<typeof BuildStageEventSchema>;
