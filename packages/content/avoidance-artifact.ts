import type {LessonArtifact} from './index';
import {avoidanceProgram} from './avoidance-program';
import {avoidanceWorld} from './avoidance-world';
export const avoidanceArtifact:LessonArtifact={starter:avoidanceProgram(400),reference:avoidanceProgram(),world:avoidanceWorld('recovery')};
