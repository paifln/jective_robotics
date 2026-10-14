import {it,expect} from 'vitest';
import {additionalPracticeWorlds} from '../packages/simulator/practice-worlds';
import {worlds,WorldSchema} from '../packages/simulator';
import {worldNames} from '../packages/content/simulation-labs';

it('offers sixteen uniquely named fields with translated names and valid new geometry',()=>{
 expect(worlds).toHaveLength(16);expect(new Set(worlds.map(w=>w.id)).size).toBe(16);
 for(const w of worlds)for(const locale of ['en','ru','kk'] as const)expect(worldNames[w.id]?.[locale]).toBeTruthy();
 for(const w of additionalPracticeWorlds)expect(WorldSchema.parse(w)).toEqual(w);
});
it('each new area has an obstacle-free route for a robot radius of 9 cm',()=>{
 // Flood-fill with expanded obstacles proves geometric reachability, not controller success.
 for(const w of additionalPracticeWorlds){
  const spacing=.1,radius=.09,columns=Math.round(w.width/spacing),rows=Math.round(w.height/spacing);
  const free=(x:number,y:number)=>x>=radius&&y>=radius&&x<=w.width-radius&&y<=w.height-radius&&!w.obstacles.some(o=>x>=o.x-radius&&x<=o.x+o.width+radius&&y>=o.y-radius&&y<=o.y+o.height+radius);
  expect(free(w.start.x,w.start.y)).toBe(true);expect(free(w.goal.x,w.goal.y)).toBe(true);
  const queue:[[number,number]]=[[Math.round(w.start.x/spacing),Math.round(w.start.y/spacing)]],seen=new Set<string>();let reached=false;
  for(let cursor=0;cursor<queue.length;cursor++){const [x,y]=queue[cursor]!,key=x+','+y;if(seen.has(key))continue;seen.add(key);
   if(Math.hypot(x*spacing-w.goal.x,y*spacing-w.goal.y)<=w.goal.radius){reached=true;break;}
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx!,ny=y+dy!;if(nx>=0&&ny>=0&&nx<=columns&&ny<=rows&&free(nx*spacing,ny*spacing)&&!seen.has(nx+','+ny))queue.push([nx,ny]);}
  }expect(reached,w.id).toBe(true);
 }
});
