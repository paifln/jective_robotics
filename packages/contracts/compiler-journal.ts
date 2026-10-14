import {z} from 'zod';
export const JournalPageSchema=z.object({text:z.string().max(65540),offset:z.number().int().nonnegative(),nextOffset:z.number().int().nonnegative(),totalBytes:z.number().int().min(0).max(64*1024*1024),complete:z.boolean()}).strict().refine(page=>page.offset<=page.nextOffset&&page.nextOffset<=page.totalBytes&&page.nextOffset-page.offset<=65536&&page.complete===(page.nextOffset===page.totalBytes)&&(page.complete||page.nextOffset>page.offset),'PROCESS_LOG_PAGE_INVALID');
export type JournalPage=z.infer<typeof JournalPageSchema>;
