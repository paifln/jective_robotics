export const notificationCodes=['project-saved','build-ready','build-failed','build-cancelled'] as const;
export type NotificationCode=typeof notificationCodes[number];
export type StudioNotification=Readonly<{id:number;code:NotificationCode;detail:string;time:number;read:boolean}>;

/** Session-only bounded state; no learner text is sent to an external notification service. */
export class NotificationStore{
 private items:readonly StudioNotification[]=[];
 private listeners=new Set<()=>void>();
 private sequence=0;
 constructor(private readonly clock=()=>Date.now()){}
 snapshot=()=>this.items;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 private publish(items:readonly StudioNotification[]){this.items=Object.freeze(items);for(const listener of this.listeners)listener();}
 add(code:NotificationCode,detail=''){
  if(!notificationCodes.includes(code)||typeof detail!=='string')throw new Error('INVALID_NOTIFICATION');
  const item=Object.freeze({id:++this.sequence,code,detail:detail.slice(0,160),time:this.clock(),read:false});
  this.publish([item,...this.items].slice(0,30));return item.id;
 }
 markRead(){if(this.items.some(item=>!item.read))this.publish(this.items.map(item=>Object.freeze({...item,read:true})));}
 clear(){if(this.items.length)this.publish([]);}
}
