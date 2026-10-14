import type {World} from './world-schema';

/** Extra practice geometry; uses the same simulator, not a different physics model. */
export const additionalPracticeWorlds:World[]=[
 {id:'courtyard',width:6,height:4,start:{x:.5,y:2,heading:0},goal:{x:5.5,y:2,radius:.25},obstacles:[{x:2,y:1,width:2,height:2}],line:[]},
 {id:'switchback',width:6,height:4,start:{x:.5,y:.5,heading:0},goal:{x:5.5,y:3.5,radius:.25},obstacles:[{x:1.5,y:0,width:.25,height:2.8},{x:3,y:1.2,width:.25,height:2.8},{x:4.5,y:0,width:.25,height:2.8}],line:[]},
 {id:'s-bend',width:6,height:4,start:{x:.5,y:1,heading:0},goal:{x:5.5,y:3,radius:.25},obstacles:[],line:[{x:.5,y:1},{x:1.5,y:1},{x:2.5,y:2},{x:3.5,y:2},{x:4.5,y:3},{x:5.5,y:3}]},
 {id:'loading-bay',width:6,height:4,start:{x:.5,y:2,heading:0},goal:{x:5,y:2,radius:.18},obstacles:[{x:3.8,y:1.25,width:1.7,height:.2},{x:3.8,y:2.55,width:1.7,height:.2},{x:5.3,y:1.25,width:.2,height:1.5}],line:[]},
];
