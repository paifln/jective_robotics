import type {Project} from '../contracts';
import {profiles,resolveProfile,validateWiring} from './index';
import {validateImportedProfile} from './exchange';
export function projectProfile(project:Project){
 const builtin=profiles.find(p=>p.id===project.profileId);if(builtin){if(project.profileDefinition)throw new Error('PROFILE_BUILTIN_OVERRIDE');return resolveProfile(project.profileId);}
 if(!project.profileDefinition||!project.profileVersion||!project.profileHash)throw new Error('PROFILE_BINDING_REQUIRED');const p=validateImportedProfile(project.profileDefinition);if(p.id!==project.profileId||p.version!==project.profileVersion)throw new Error('PROFILE_BINDING_MISMATCH');return p;
}
export function indicatorPin(project:Project){const profile=projectProfile(project);if(!project.wiring||!Object.hasOwn(project.wiring,'led'))return profile.ledPin;const pin=project.wiring.led;if(pin===null)return null;const issues=validateWiring(profile,'indicator',{led:pin??null});const blocking=issues.find(i=>i.blocking);if(blocking)throw new Error(blocking.code+': '+blocking.message);if(Object.entries(project.wiring).some(([role,value])=>role!=='led'&&value===pin))throw new Error('PIN_CONFLICT: indicator pin is allocated to another logical role');return pin??null;}
