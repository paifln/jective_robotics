import type {LessonArtifact} from './index';
import {createRepeatableWorld,repeatablePrograms} from './repeatable-experiment';
export const repeatableArtifact:LessonArtifact={world:createRepeatableWorld(23,.05),starter:structuredClone(repeatablePrograms.near),reference:structuredClone(repeatablePrograms.early)};
