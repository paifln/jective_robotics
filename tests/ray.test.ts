import {it,expect} from 'vitest';
import {rayDistance} from '../packages/simulator/ray';
import {worlds} from '../packages/simulator';
it('ideal rays measure known surfaces from the robot centre without step-size bias',()=>{
 const world=worlds[0]!;for(const distance of [.2,.5,1,1.5,2]){const scenario={...world,obstacles:[{x:world.start.x+distance,y:1,width:.1,height:1}]};expect(rayDistance(scenario,world.start,2)).toEqual({meters:distance,status:'valid',source:'ray'});}
 for(const [heading,distance] of [[0,3.5],[Math.PI, .5],[Math.PI/2,1.5],[-Math.PI/2,1.5]])expect(rayDistance(world,{...world.start,heading:heading!},5).meters).toBe(distance);
 expect(rayDistance({...world,obstacles:[{x:.7,y:2,width:.1,height:.1}]},world.start,2).meters).toBeNull();expect(rayDistance({...world,obstacles:[{x:.2,y:1,width:.1,height:1}]},world.start,2).meters).toBeNull();
 const target={...world,obstacles:[{x:1,y:1,width:.2,height:1},{x:2,y:1,width:.2,height:1}]};expect(rayDistance(target,world.start,2).meters).toBe(.5);expect(rayDistance(target,world.start,2,.1).meters).toBe(.6);expect(rayDistance(target,world.start,2,-1).status).toBe('outOfRange');expect(rayDistance(target,world.start,2,2).status).toBe('outOfRange');
 expect(rayDistance(world,world.start,2)).toEqual({meters:null,status:'outOfRange',source:'ray'});
 for(const heading of [Math.PI/4,3*Math.PI/4,5*Math.PI/4,7*Math.PI/4])expect(rayDistance(target,{...world.start,heading},5).status).toBe('valid');
});
