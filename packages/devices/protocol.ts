import {z} from 'zod';
export const FrameSchema=z.discriminatedUnion('type',[
 z.object({v:z.literal(1),type:z.literal('hello'),firmware:z.string().min(1).max(80),profile:z.string().min(1).max(80),device:z.string().min(1).max(80),session:z.string().min(1).max(80),capabilities:z.array(z.string().min(1).max(80)).max(20)}).strict(),
 z.object({v:z.literal(1),type:z.literal('telemetry'),seq:z.number().int().min(0).max(4294967295),values:z.record(z.string().min(1).max(80),z.number().finite()).refine(values=>Object.keys(values).length<=64)}).strict(),
 z.object({v:z.literal(1),type:z.literal('challenge'),nonce:z.number().int().min(0).max(4294967295)}).strict(),
 z.object({v:z.literal(1),type:z.literal('ack'),seq:z.number().int().min(0).max(4294967295),commandId:z.string().min(1).max(80)}).strict(),
 z.object({v:z.literal(1),type:z.literal('error'),code:z.string().min(1).max(80)}).strict()
]);
