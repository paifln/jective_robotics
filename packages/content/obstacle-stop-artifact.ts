import type {LessonArtifact} from './index';
import {obstacleStopProgram} from './obstacle-stop';
import {steeringWorld} from './differential-experiment';

/** Missing data exposes the starter defect; the reference checks validity first. */
export const obstacleStopArtifact:LessonArtifact={
 starter:obstacleStopProgram(.3,false),
 reference:obstacleStopProgram(.3,true),
 world:{...structuredClone(steeringWorld),id:'L25-missing-data',distanceInput:{initialMeters:1,events:[{timeMs:200,meters:null},{timeMs:400,meters:1}]}}
};
