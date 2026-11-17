import {z} from 'zod';

export const ArduinoCommandSchema=z.enum(['F','B','L','R','S']);
export type ArduinoCommand=z.infer<typeof ArduinoCommandSchema>;
export const ArduinoConnectionSchema=z.object({id:z.uuid(),port:z.string().min(1).max(100)}).strict();
export type ArduinoConnection=z.infer<typeof ArduinoConnectionSchema>;
export const ArduinoOpenSchema=z.object({path:z.string().min(1).max(100)}).strict();
export const ArduinoCommandRequestSchema=z.object({sessionId:z.uuid(),sequence:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),command:ArduinoCommandSchema}).strict();
export type ArduinoCommandRequest=z.infer<typeof ArduinoCommandRequestSchema>;
export const ArduinoCloseSchema=z.object({sessionId:z.uuid()}).strict();
