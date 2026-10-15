import {z} from 'zod';
export const WindowPlacementSchema=z.object({version:z.literal(1),bounds:z.object({x:z.number().int().min(-100000).max(100000),y:z.number().int().min(-100000).max(100000),width:z.number().int().min(100).max(16384),height:z.number().int().min(100).max(16384)}).strict(),maximized:z.boolean()}).strict();
export type WindowPlacement=z.infer<typeof WindowPlacementSchema>;
export type WorkArea={x:number;y:number;width:number;height:number};

/** Clamp restored coordinates to an available work area, including negative-coordinate monitors. */
export function restoreWindowPlacement(value:unknown,areas:readonly WorkArea[]){
 const available=areas.filter(area=>[area.x,area.y,area.width,area.height].every(Number.isFinite)&&area.width>0&&area.height>0);
 const primary=available[0]??{x:0,y:0,width:1366,height:768};
 const saved=WindowPlacementSchema.safeParse(value);
 const overlap=(area:WorkArea)=>{if(!saved.success)return 0;const b=saved.data.bounds;return Math.max(0,Math.min(area.x+area.width,b.x+b.width)-Math.max(area.x,b.x))*Math.max(0,Math.min(area.y+area.height,b.y+b.height)-Math.max(area.y,b.y));};
 const target=available.reduce((best,area)=>overlap(area)>overlap(best)?area:best,primary);
 const width=Math.min(target.width,Math.max(760,saved.success?saved.data.bounds.width:1366));
 const height=Math.min(target.height,Math.max(580,saved.success?saved.data.bounds.height:768));
 const clamp=(n:number,min:number,max:number)=>Math.min(Math.max(n,min),max);
 return {bounds:{x:Math.round(clamp(saved.success?saved.data.bounds.x:target.x+(target.width-width)/2,target.x,target.x+target.width-width)),y:Math.round(clamp(saved.success?saved.data.bounds.y:target.y+(target.height-height)/2,target.y,target.y+target.height-height)),width:Math.floor(width),height:Math.floor(height)},maximized:saved.success&&saved.data.maximized,minWidth:Math.min(760,target.width),minHeight:Math.min(580,target.height)};
}
