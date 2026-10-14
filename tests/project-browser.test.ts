import {it,expect} from 'vitest';
import {WorkspaceStore} from '../packages/persistence/workspace';
import {ProjectListRequestSchema} from '../packages/contracts/project-browser';
import {randomUUID} from 'node:crypto';
it('browses beyond recent projects, paginates deterministically and searches literal Unicode names',()=>{
 const store=new WorkspaceStore(':memory:');
 try{
  const ids=[];for(let i=0;i<65;i++){const id=randomUUID();ids.push(id);store.autosave({schemaVersion:1,id,name:i===0?'Робот Әлем %_':`Project ${i}`,profileId:'esp32-devkit-reference',mode:'code',source:'',workspace:{},revision:0});store.db.prepare('UPDATE projects SET saved_at=? WHERE id=?').run(new Date(1700000000000+i*1000).toISOString(),id);}
  expect(store.state().recent).toHaveLength(20);
  const first=store.listProjects({query:'',offset:0,limit:50}),second=store.listProjects({query:'',offset:50,limit:50});expect(first.total).toBe(65);expect(first.items).toHaveLength(50);expect(second.items).toHaveLength(15);expect(new Set([...first.items,...second.items].map(p=>p.id)).size).toBe(65);
  expect(store.listProjects({query:'РОБОТ әЛЕМ %_',offset:0,limit:50}).items.map(p=>p.id)).toEqual([ids[0]]);
  expect(store.listProjects({query:"' OR 1=1 --",offset:0,limit:50}).total).toBe(0);
  expect(()=>store.listProjects({query:'',offset:-1,limit:50})).toThrow();expect(ProjectListRequestSchema.safeParse({query:'',offset:0,limit:51}).success).toBe(false);
 }finally{store.close();}
});
