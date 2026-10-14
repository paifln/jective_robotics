import {it,expect,vi} from 'vitest';
import {readWorldFile} from '../packages/simulator/world-file';
import {createLessonWorld,exportLessonWorld} from '../packages/simulator/world-design';
const world=createLessonWorld({width:6,height:4,start:{x:1,y:1,headingDegrees:90},goal:{x:5,y:3,radius:.25},obstacles:[]});
it('bounds files before reading and validates actual contents rather than file names',async()=>{
 const text=vi.fn(async()=>JSON.stringify(exportLessonWorld(world)));
 for(const size of [0,1000001,-1,1.5,NaN,Infinity])await expect(readWorldFile({size,text})).rejects.toThrow();expect(text).not.toHaveBeenCalled();
 await expect(readWorldFile({size:1000000,text})).resolves.toEqual(world);expect(text).toHaveBeenCalledOnce();
});
it('preserves full supported worlds and propagates unreadable or invalid documents without substitution',async()=>{
 const complete={...world,line:[{x:1,y:1},{x:2,y:2}],inputs:{button:true},buttonEvents:[{timeMs:300,pressed:false}]};await expect(readWorldFile({size:2000,text:async()=>JSON.stringify(exportLessonWorld(complete))})).resolves.toEqual(complete);
 for(const value of ['<svg/>','null','{',JSON.stringify({...exportLessonWorld(world),units:{position:'cm',heading:'rad',time:'ms'}}),'x'.repeat(1000001)])await expect(readWorldFile({size:1,text:async()=>value})).rejects.toThrow();
 await expect(readWorldFile({size:1,text:async()=>{throw new Error('read failed');}})).rejects.toThrow('read failed');
});
