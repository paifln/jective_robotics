import {it,expect} from 'vitest';
import {randomUUID,createHash} from 'node:crypto';
import {profiles} from '../packages/profiles';
import {profileHash} from '../packages/profiles/registry';
import {projectProfile} from '../packages/profiles/project';
import {verifyProjectProfile} from '../packages/profiles/binding';
import {ProjectSchema,type Project} from '../packages/contracts';
import {encodeArchive,decodeArchive} from '../packages/persistence/archives';
import {buildSourceHash,ToolchainService} from '../packages/toolchain';
const base:Project={schemaVersion:1,id:randomUUID(),name:'Custom bound project',profileId:'esp32-devkit-reference',mode:'code',source:'void setup(){} void loop(){}',workspace:{},revision:0};
it('portable custom projects retain exact definitions and resolve their version and hash without a registry',()=>{
 const profile={...profiles[0]!,id:'custom-bound-board',ledPin:4};const p=ProjectSchema.parse({...base,profileId:profile.id,profileDefinition:profile,profileVersion:profile.version,profileHash:profileHash(profile)});const archive=decodeArchive(encodeArchive('project',p));expect(archive.kind).toBe('project');expect(archive.value).toEqual(p);expect(projectProfile(p)).toEqual(profile);expect(verifyProjectProfile(p)).toEqual({profile,hash:profileHash(profile)});expect(buildSourceHash(p)).not.toBe(buildSourceHash(base));expect(verifyProjectProfile({...p,profileDefinition:{...profile,pins:[...profile.pins].reverse()}}).hash).toBe(p.profileHash);
});
it('missing, mismatched and altered bindings are rejected before compilation',async()=>{
 const profile={...profiles[0]!,id:'custom-bound-board'};const p:Project={...base,profileId:profile.id,profileDefinition:profile,profileVersion:profile.version,profileHash:profileHash(profile)};expect(()=>ProjectSchema.parse({...base,profileId:profile.id})).toThrow('PROFILE_BINDING_REQUIRED');expect(()=>projectProfile({...p,profileDefinition:undefined})).toThrow('PROFILE_BINDING_REQUIRED');expect(()=>projectProfile({...p,profileVersion:'2.0.0'})).toThrow('PROFILE_BINDING_MISMATCH');expect(()=>projectProfile({...p,profileDefinition:{...profile,id:'another-board'}})).toThrow('PROFILE_BINDING_MISMATCH');const altered={...p,profileDefinition:{...profile,name:'Altered'}};expect(()=>verifyProjectProfile(altered)).toThrow('PROFILE_MIGRATION_REQUIRED');await expect(new ToolchainService('NOT_INVOKED','test-results/unused-custom-binding').compile(altered)).rejects.toThrow('PROFILE_MIGRATION_REQUIRED');expect(()=>projectProfile({...base,profileDefinition:profiles[0]})).toThrow('PROFILE_BUILTIN_OVERRIDE');
});
it('legacy bundled projects preserve the original hash format and require explicit review for changed pinned metadata',()=>{
 const profile=profiles[0]!;const hash=createHash('sha256').update(JSON.stringify(profile)).digest('hex');expect(verifyProjectProfile(base)).toEqual({profile,hash});expect(verifyProjectProfile({...base,profileVersion:profile.version,profileHash:hash}).hash).toBe(hash);expect(()=>verifyProjectProfile({...base,profileVersion:'0.0.1'})).toThrow('PROFILE_MIGRATION_REQUIRED');expect(()=>verifyProjectProfile({...base,profileHash:'bad'})).toThrow('PROFILE_MIGRATION_REQUIRED');
});
