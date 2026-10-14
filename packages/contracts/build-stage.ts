import {z} from 'zod';
export const BuildStageSchema=z.enum(['toolchain','environment-before','compile','environment-after','artifacts']);
export type BuildStage=z.infer<typeof BuildStageSchema>;
export const BuildStageEventSchema=z.object({projectId:z.uuid(),stage:BuildStageSchema}).strict();
export type BuildStageEvent=z.infer<typeof BuildStageEventSchema>;
