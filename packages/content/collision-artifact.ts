import type {LessonArtifact} from './index';
import {collisionCases,unguardedMotion,guardedMotion} from './collision-cases';
export const collisionArtifact:LessonArtifact={world:structuredClone(collisionCases.wall!),starter:structuredClone(unguardedMotion),reference:structuredClone(guardedMotion)};
