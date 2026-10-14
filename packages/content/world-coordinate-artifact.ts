import type {LessonArtifact} from './index';
import {createLessonWorld} from '../simulator/world-design';
export const worldCoordinateArtifact:LessonArtifact={world:createLessonWorld({width:6,height:4,start:{x:1,y:1,headingDegrees:0},goal:{x:5,y:3,radius:.25},obstacles:[{x:3,y:1,width:.5,height:1}]}),starter:{setup:[{kind:'drive',left:10,right:10},{kind:'wait',ms:1000},{kind:'stop'}],loop:[]},reference:{setup:[{kind:'drive',left:20,right:20},{kind:'wait',ms:1000},{kind:'stop'}],loop:[]}};
