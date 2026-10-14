import {createHash} from 'node:crypto';
import {ProjectSchema,AssignmentSchema,SubmissionSchema,type Project} from '../contracts';
import {projectProfile} from './project';
import {profileHash} from './registry';
export function verifyProjectProfile(project:Project){const profile=projectProfile(project);const hash=project.profileDefinition?profileHash(profile):createHash('sha256').update(JSON.stringify(profile)).digest('hex');if((project.profileVersion&&project.profileVersion!==profile.version)||(project.profileHash&&project.profileHash!==hash))throw new Error('PROFILE_MIGRATION_REQUIRED: explicitly review and select the intended profile version');return {profile,hash};}
export function validateStoredProject(value:unknown){const project=ProjectSchema.parse(value);if(project.profileDefinition)verifyProjectProfile(project);return project;}
export function validateStoredAssignment(value:unknown){const assignment=AssignmentSchema.parse(value);if(assignment.starter)validateStoredProject(assignment.starter);return assignment;}
export function validateStoredSubmission(value:unknown){const submission=SubmissionSchema.parse(value);validateStoredProject(submission.project);return submission;}
