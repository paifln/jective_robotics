import {z} from 'zod';
export const ProjectListRequestSchema=z.object({query:z.string().max(100).default(''),offset:z.number().int().min(0).max(1000000).default(0),limit:z.number().int().min(1).max(50).default(50)}).strict();
export const ProjectListPageSchema=z.object({items:z.array(z.object({id:z.uuid(),name:z.string().min(1).max(100),savedAt:z.string()})).max(50),total:z.number().int().nonnegative()});
export type ProjectListRequest=z.infer<typeof ProjectListRequestSchema>;
export type ProjectListPage=z.infer<typeof ProjectListPageSchema>;
