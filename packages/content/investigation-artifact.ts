import type {LessonArtifact} from './index';
import {investigationWorlds} from './navigation-investigation';
import {repeatablePrograms} from './repeatable-experiment';
export const investigationArtifact:LessonArtifact={world:structuredClone(investigationWorlds.wall),starter:structuredClone(repeatablePrograms.early),reference:structuredClone(repeatablePrograms.near)};
