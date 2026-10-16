import {it,expect} from 'vitest';
import {safeWorkspaceData,workspaceDataLimits as limits} from '../packages/contracts/workspace-data';
import {WorkspaceSchema} from '../packages/contracts';
import {artifacts} from '../packages/content/lessons';
import {programWorkspace} from '../apps/desktop/renderer/blocks';

it('admits authored block workspaces, ordinary JSON, null-prototype records and repeated acyclic values',()=>{
 const shared={x:1};for(const workspace of [{},{a:null,b:true,c:undefined,d:3,e:'Қазақша',array:[1,false,null]},{a:shared,b:shared},Object.assign(Object.create(null),{x:1})])expect(safeWorkspaceData(workspace)).toBe(true);
 let checked=0;for(const artifact of Object.values(artifacts))for(const program of [artifact.starter,artifact.reference])if(program){expect(WorkspaceSchema.safeParse(programWorkspace(program)).success).toBe(true);checked++;}expect(checked).toBeGreaterThan(30);
});
it('rejects cycles, executable/accessor values, non-finite numbers, dangerous keys and unsupported object types',()=>{
 const cycle:Record<string,unknown>={};cycle.self=cycle;let getterCalls=0;const getter=Object.defineProperty({},'x',{enumerable:true,get(){getterCalls++;return 1;}}),array:unknown[]=[];Object.setPrototypeOf(array,null);
 for(const value of [null,[],1,'x',{x:Infinity},{x:NaN},{x:()=>1},{x:1n},{x:Symbol('fixture')},{x:new Date()},{x:new Map()},cycle,getter,{x:array},{[Symbol('fixture')]:1},JSON.parse('{"__proto__":{"polluted":true}}'),{constructor:{}},{prototype:{}}])expect(safeWorkspaceData(value)).toBe(false);
 expect(getterCalls).toBe(0);expect(({} as Record<string,unknown>).polluted).toBeUndefined();
});
it('bounds depth, aggregate characters and nodes before recursive editor loading',()=>{
 const root:Record<string,unknown>={};let cursor=root;for(let index=0;index<limits.depth;index++){const next={};cursor.next=next;cursor=next;}expect(safeWorkspaceData(root)).toBe(true);cursor.next={};expect(safeWorkspaceData(root)).toBe(false);
 expect(safeWorkspaceData({x:'a'.repeat(limits.characters-1)})).toBe(true);expect(safeWorkspaceData({x:'a'.repeat(limits.characters)})).toBe(false);
 expect(safeWorkspaceData({x:new Array(limits.nodes+1)})).toBe(false);expect(safeWorkspaceData({x:Array.from({length:limits.nodes},()=>null)})).toBe(false);
});
