import {z} from 'zod';
export const JournalOffsetSchema=z.number().int().min(0).max(64*1024*1024);
export const JournalPageRequestSchema=z.object({operationId:z.uuid(),offset:JournalOffsetSchema}).strict();
export const JournalPageSchema=z.object({text:z.string().max(65540),offset:z.number().int().nonnegative(),nextOffset:z.number().int().nonnegative(),totalBytes:z.number().int().min(0).max(64*1024*1024),complete:z.boolean()}).strict().refine(page=>page.offset<=page.nextOffset&&page.nextOffset<=page.totalBytes&&page.nextOffset-page.offset<=65536&&page.complete===(page.nextOffset===page.totalBytes)&&(page.complete||page.nextOffset>page.offset),'PROCESS_LOG_PAGE_INVALID');
export type JournalPage=z.infer<typeof JournalPageSchema>;
/** A valid page must also belong to the exact byte range requested over IPC. */
export function journalPageAtOffsetSchema(offset:unknown){
 const requested=JournalOffsetSchema.parse(offset);
 return JournalPageSchema.refine(page=>page.offset===requested,'PROCESS_LOG_OFFSET_MISMATCH');
}
