import {it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {DocumentSession} from '../packages/persistence/document-session';
import type {Project} from '../packages/contracts';
const project=():Project=>({schemaVersion:1,id:randomUUID(),name:'Prepared project',profileId:'esp32-devkit-reference',mode:'code',source:'void setup(){}\nvoid loop(){}',workspace:{},revision:1});
const oldBinding={path:'old.json',revision:1,fingerprint:'a'.repeat(64)},newBinding={path:'new.json',revision:1,fingerprint:'b'.repeat(64)};
it('prepares without changing the active file and accepts only the exact candidate once',()=>{
 const session=new DocumentSession();expect(session.adoptSaved(oldBinding,0)).toBe(true);const original=project(),prepared=session.prepare(original,newBinding);original.source='caller mutation';
 expect(session.binding).toEqual(oldBinding);expect(session.version).toBe(0);expect(Object.isFrozen(session.binding)).toBe(true);
 expect(()=>session.accept({...prepared,source:'altered'},()=>{})).toThrow('PROJECT_OPEN_STALE');expect(session.binding).toEqual(oldBinding);
 const accepted=session.accept(prepared,()=>{throw new Error('FILE_OPEN_MUST_NOT_PERSIST');});expect(accepted.source).not.toBe(original.source);expect(session.binding).toEqual(newBinding);expect(session.version).toBe(1);expect(()=>session.accept(prepared,()=>{})).toThrow('PROJECT_OPEN_STALE');
});
it('newer preparations, explicit clear and newer completed saves invalidate stale acknowledgements',()=>{
 const session=new DocumentSession(),first=session.prepare(project(),newBinding),second=session.prepare(project(),null);
 expect(()=>session.accept(first,()=>{})).toThrow('PROJECT_OPEN_STALE');session.clear();expect(()=>session.accept(second,()=>{})).toThrow('PROJECT_OPEN_STALE');expect(session.binding).toBeNull();
 expect(session.adoptSaved(oldBinding,0)).toBe(false);expect(session.binding).toBeNull();const third=session.prepare(project(),newBinding);expect(session.adoptSaved(oldBinding,session.version)).toBe(true);expect(()=>session.accept(third,()=>{})).toThrow('PROJECT_OPEN_STALE');expect(session.binding).toEqual(oldBinding);
});
it('mutating a returned candidate does not change the private prepared copy, and failed persistence leaves the old binding intact',()=>{
 const session=new DocumentSession();session.adoptSaved(oldBinding,0);const input=project(),candidate=session.prepare(input,null,true),saved=structuredClone(candidate);candidate.workspace.x='mutation';expect(()=>session.accept(candidate,()=>{})).toThrow('PROJECT_OPEN_STALE');
 expect(()=>session.accept(saved,()=>{throw new Error('EXPLICIT_DATABASE_FULL');})).toThrow('EXPLICIT_DATABASE_FULL');expect(session.binding).toEqual(oldBinding);expect(session.version).toBe(0);
 let persisted:Project|undefined;expect(session.accept(saved,value=>{persisted=value;})).toEqual(input);expect(persisted).toEqual(input);expect(session.binding).toBeNull();expect(session.version).toBe(1);
});
