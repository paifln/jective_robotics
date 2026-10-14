import {z} from 'zod';
import {ProjectSchema} from '../contracts';
import {components,validateWiring} from './index';
import {projectProfile} from './project';
const MotorDriver=z.enum(['motor-direction-enable','motor-dual-input']);
export const SubstitutionRequestSchema=z.object({project:ProjectSchema,previous:MotorDriver,next:MotorDriver,mapping:z.record(z.string().max(80),z.number().int().min(0).max(48).nullable())}).strict();
/** Review only. This never installs a driver, changes source, applies wiring or grants upload authority. */
export function reviewMotorSubstitution(value:unknown){
 const request=SubstitutionRequestSchema.parse(value);if(request.previous===request.next)throw new Error('SUBSTITUTION_DISTINCT_DRIVER_REQUIRED');
 const before=components.find(c=>c.id===request.previous)!,after=components.find(c=>c.id===request.next)!,profile=projectProfile(request.project),allowed=new Set(after.roles.map(r=>r.name));
 if(Object.keys(request.mapping).some(role=>!allowed.has(role)))throw new Error('SUBSTITUTION_MAPPING_ROLE_INVALID');
 const oldRoles=new Set(before.roles.map(r=>r.name)),existing={...request.project.wiring};const nextWiring=Object.fromEntries(Object.entries(existing).filter(([role])=>!oldRoles.has(role)));
 const knownRoles=new Set(components.flatMap(component=>component.roles.map(role=>role.name)));if(Object.keys(existing).some(role=>!knownRoles.has(role)))throw new Error('SUBSTITUTION_EXISTING_ROLE_UNKNOWN');
 for(const role of after.roles)nextWiring[role.name]=request.mapping[role.name]??null;
 const previousIssues=validateWiring(profile,before.id,existing),issues=validateWiring(profile,after.id,nextWiring);
 return {schemaVersion:1,origin:'software-profile-substitution-review',projectId:request.project.id,projectRevision:request.project.revision,profile:{id:profile.id,version:profile.version},previous:{id:before.id,version:before.version,driver:before.driver,roles:before.roles,safeState:before.safeState},next:{id:after.id,version:after.version,driver:after.driver,roles:after.roles,safeState:after.safeState},diff:{removedRoles:before.roles.map(r=>r.name),addedRoles:after.roles.map(r=>r.name),previousWiring:existing,nextWiring},previousIssues,issues,compatibility:issues.some(i=>i.blocking)?'mapping-blocked':'mapping-valid',sourceReviewRequired:true,driverImplementation:'NOT VERIFIED by mapping review',physicalVerification:'NOT RUN',assumptions:after.assumptions};
}
