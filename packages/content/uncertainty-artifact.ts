import type {LessonArtifact} from './index';
import {createRepeatableWorld} from './repeatable-experiment';
import {stationaryProgram} from './sensor-uncertainty';
export const uncertaintyArtifact:LessonArtifact={world:createRepeatableWorld(23,.05),starter:structuredClone(stationaryProgram),reference:structuredClone(stationaryProgram)};
