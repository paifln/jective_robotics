import {it,expect} from 'vitest';
import {createLessonWorld,exportLessonWorld,WorldExportSchema,predictStraightPose,parseWorldDocument} from '../packages/simulator/world-design';
const input={width:6,height:4,start:{x:1,y:1,headingDegrees:0},goal:{x:5,y:3,radius:.25},obstacles:[{x:3,y:1,width:.5,height:1}]};
it('keeps metres, converts degrees to radians and labels the actual screen coordinate convention',()=>{
 const world=createLessonWorld(input);expect(world.start).toEqual({x:1,y:1,heading:0});expect(world.obstacles).toEqual(input.obstacles);expect(createLessonWorld({...input,start:{x:1,y:1,headingDegrees:90}}).start.heading).toBe(Math.PI/2);
 const exported=exportLessonWorld(world);expect(exported.units).toEqual({position:'m',heading:'rad',time:'ms'});expect(exported.coordinates).toEqual({origin:'top-left',positiveX:'right',positiveY:'down',positiveHeading:'clockwise'});expect(WorldExportSchema.parse(JSON.parse(JSON.stringify(exported)))).toEqual(exported);expect(exported.physicalVerification).toBe('NOT RUN');
 for(const changed of [{...exported,units:{...exported.units,position:'cm'}},{...exported,coordinates:{...exported.coordinates,positiveY:'up'}},{...exported,extra:true}])expect(()=>WorldExportSchema.parse(changed)).toThrow();
});
it('imports labeled and legacy raw world documents without dropping geometry or accepting unsupported units',()=>{
 const world=createLessonWorld(input),document=exportLessonWorld(world);expect(parseWorldDocument(JSON.stringify(document))).toEqual(world);expect(parseWorldDocument(JSON.stringify(world))).toEqual(world);for(const text of ['{','null','[]','x'.repeat(1000001),JSON.stringify({...document,format:'other'}),JSON.stringify({...document,units:{...document.units,position:'cm'}})])expect(()=>parseWorldDocument(text)).toThrow();
});
it('preserves scheduled event timestamps as labeled milliseconds across export/import',()=>{
 const world={...createLessonWorld(input),buttonEvents:[{timeMs:200,pressed:true},{timeMs:400,pressed:false}]};const document=exportLessonWorld(world);expect(document.units.time).toBe('ms');expect(parseWorldDocument(JSON.stringify(document)).buttonEvents).toEqual(world.buttonEvents);expect(()=>WorldExportSchema.parse({...document,units:{...document.units,time:'seconds'}})).toThrow();
});
it('rejects geometry outside the field, unsafe starts, blocked goals and unbounded designer inputs',()=>{
 for(const changed of [{...input,width:0},{...input,start:{x:.01,y:1,headingDegrees:0}},{...input,start:{x:3.2,y:1.2,headingDegrees:0}},{...input,start:{x:1,y:1,headingDegrees:361}},{...input,obstacles:[{x:5.9,y:1,width:1,height:1}]},{...input,goal:{x:3.2,y:1.2,radius:.1}},{...input,goal:{x:6,y:3,radius:.25}},{...input,obstacles:Array(21).fill(input.obstacles[0])},{...input,extra:true}])expect(()=>createLessonWorld(changed)).toThrow();
});
it('uses real fixed-step kinematics for pose predictions and rejects collisions instead of clipping them',()=>{
 const world=createLessonWorld(input);const east=predictStraightPose(world,.5);expect(east.x).toBeCloseTo(1.5,10);expect(east.y).toBe(1);const south=predictStraightPose(createLessonWorld({...input,start:{x:1,y:1,headingDegrees:90}}),.5);expect(south.x).toBeCloseTo(1,10);expect(south.y).toBeCloseTo(1.5,10);expect(predictStraightPose(world,-.5).x).toBeCloseTo(.5,10);expect(predictStraightPose(world,0)).toEqual(world.start);expect(()=>predictStraightPose(world,2)).toThrow('WORLD_PREDICTION_COLLISION');for(const distance of [2.01,-2.01,NaN,Infinity])expect(()=>predictStraightPose(world,distance)).toThrow();
});
