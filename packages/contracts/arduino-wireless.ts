import {z} from 'zod';

export const WIRELESS_PROGRAM_VERSION=1;
export const WIRELESS_MAX_STEPS=96;
const integer=z.number().int();
export const WirelessStepSchema=z.discriminatedUnion('op',[
 z.object({op:z.literal('m'),a:integer.min(-255).max(255),b:integer.min(-255).max(255)}).strict(),
 z.object({op:z.literal('w'),a:integer.min(0).max(60000),b:z.literal(0)}).strict(),
 z.object({op:z.literal('s'),a:z.literal(0),b:z.literal(0)}).strict(),
 z.object({op:z.literal('l'),a:z.union([z.literal(0),z.literal(1)]),b:z.literal(0)}).strict()
]);
export type WirelessStep=z.infer<typeof WirelessStepSchema>;
export const WirelessProgramSchema=z.object({
 version:z.literal(WIRELESS_PROGRAM_VERSION),
 steps:z.array(WirelessStepSchema).min(1).max(WIRELESS_MAX_STEPS),
 loopStart:integer.min(-1).max(WIRELESS_MAX_STEPS-1)
}).strict().refine(program=>program.loopStart===-1||program.loopStart<program.steps.length,'WIRELESS_LOOP_INDEX');
export type WirelessProgram=z.infer<typeof WirelessProgramSchema>;
export const WirelessConnectionSchema=z.object({id:z.uuid(),port:z.string().min(1).max(100),version:z.literal(WIRELESS_PROGRAM_VERSION)}).strict();
export type WirelessConnection=z.infer<typeof WirelessConnectionSchema>;
export const WirelessStateSchema=z.object({
 status:z.enum(['ready','uploading','running','stopped','completed','error']),
 sent:integer.min(0).max(WIRELESS_MAX_STEPS),
 total:integer.min(0).max(WIRELESS_MAX_STEPS),
 error:z.string().min(1).max(100).optional()
}).strict().refine(state=>state.sent<=state.total,'WIRELESS_PROGRESS_INVALID');
export type WirelessState=z.infer<typeof WirelessStateSchema>;
export const WirelessOpenSchema=z.object({path:z.string().min(1).max(100)}).strict();
export const WirelessRunSchema=z.object({sessionId:z.uuid(),program:WirelessProgramSchema}).strict();
export type WirelessRunRequest=z.infer<typeof WirelessRunSchema>;
export const WirelessSessionSchema=z.object({sessionId:z.uuid()}).strict();

/** CRC-16/CCITT-FALSE over count:u16le, loopStart:i16le, then op:u8,a:i32le,b:i32le. */
export function wirelessProgramChecksum(value:WirelessProgram):number{
 const program=WirelessProgramSchema.parse(value);
 let crc=0xffff;
 const byte=(value:number)=>{crc^=(value&0xff)<<8;for(let bit=0;bit<8;bit++)crc=((crc&0x8000)?(crc<<1)^0x1021:crc<<1)&0xffff;};
 const integerBytes=(value:number,size:number)=>{for(let offset=0;offset<size;offset++)byte(value>>>(offset*8));};
 integerBytes(program.steps.length,2);integerBytes(program.loopStart,2);
 for(const step of program.steps){byte(step.op.charCodeAt(0));integerBytes(step.a,4);integerBytes(step.b,4);}
 return crc;
}
