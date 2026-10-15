import {z} from 'zod';
export const WindowActionSchema=z.enum(['minimize','toggleMaximize','close','reload']);
export const WindowStateSchema=z.object({maximized:z.boolean(),fullscreen:z.boolean()}).strict();
export type WindowAction=z.infer<typeof WindowActionSchema>;
export type WindowState=z.infer<typeof WindowStateSchema>;
