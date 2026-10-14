import {z} from 'zod';
import {ProjectSchema,BuildSchema} from '../contracts';
import {ProfileSchema} from '../profiles';
import {projectProfile} from '../profiles/project';
export const BuildReportSchema=z.object({schemaVersion:z.literal(1),origin:z.literal('desktop-compiler-result'),recordedAt:z.iso.datetime(),project:ProjectSchema,profile:ProfileSchema,build:BuildSchema,uploadVerification:z.literal('NOT RUN by this build'),physicalVerification:z.literal('NOT RUN by this build')}).strict().refine(report=>report.profile.id===report.project.profileId,'BUILD_REPORT_PROFILE_MISMATCH');
export type BuildReport=z.infer<typeof BuildReportSchema>;
/** Snapshot of the requested source and returned result, not a physical certification. */
export function createBuildReport(project:unknown,build:unknown,recordedAt:string):BuildReport{const input=ProjectSchema.parse(project);return BuildReportSchema.parse({schemaVersion:1,origin:'desktop-compiler-result',recordedAt,project:input,profile:projectProfile(input),build,uploadVerification:'NOT RUN by this build',physicalVerification:'NOT RUN by this build'});}
