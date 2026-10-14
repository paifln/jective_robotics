import type {LessonArtifact} from './index';
import {squareRouteDefaults,squareRouteProgram} from './square-route';
import {steeringWorld} from './differential-experiment';

/** L24 learner programs share the laboratory's nominal world and commands. */
export const squareRouteArtifact:LessonArtifact={
 starter:squareRouteProgram(),
 reference:squareRouteProgram({...squareRouteDefaults,turnMs:1180}),
 world:{...structuredClone(steeringWorld),id:'L24-square-calibration'}
};
