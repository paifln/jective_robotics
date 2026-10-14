import type {LessonArtifact} from './index';
import {challengeTestWorld,challengeTestPrograms} from './challenge-test';
export const challengeTestArtifact:LessonArtifact={world:structuredClone(challengeTestWorld),starter:structuredClone(challengeTestPrograms.failing),reference:structuredClone(challengeTestPrograms.passing)};
