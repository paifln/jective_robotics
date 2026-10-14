import {z} from 'zod';
import {parseWorldDocument} from './world-design';
/** Bound file reads before allocating text; validate document contents, not the extension. */
export async function readWorldFile(file:{size:number;text:()=>Promise<string>}){
 z.number().int().min(1).max(1000000).parse(file.size);
 return parseWorldDocument(await file.text());
}
