import type {World,Pose} from './index';
import type {DistanceReading} from './distance';
/** Ideal zero-width ray from robot centre; not a physical sensor beam. */
export function rayDistance(world:World,pose:Pose,maximum:number,noise=0):DistanceReading{
 const dx=Math.cos(pose.heading),dy=Math.sin(pose.heading);
 let nearest=Math.min(dx>1e-12?(world.width-pose.x)/dx:dx< -1e-12?-pose.x/dx:Infinity,dy>1e-12?(world.height-pose.y)/dy:dy< -1e-12?-pose.y/dy:Infinity);
 for(const obstacle of world.obstacles){
  let entry=0,exit=Infinity,miss=false;
  for(const [origin,direction,lower,upper] of [[pose.x,dx,obstacle.x,obstacle.x+obstacle.width],[pose.y,dy,obstacle.y,obstacle.y+obstacle.height]]){
   if(Math.abs(direction!)<1e-12){if(origin!<lower!||origin!>upper!){miss=true;break;}}
   else{const first=(lower!-origin!)/direction!,second=(upper!-origin!)/direction!;entry=Math.max(entry,Math.min(first,second));exit=Math.min(exit,Math.max(first,second));}
  }
  if(!miss&&exit>=entry&&entry<nearest)nearest=entry;
 }
 const measured=nearest+noise;
 if(nearest>maximum||measured<0||measured>maximum)return {meters:null,status:'outOfRange',source:'ray'};
 return {meters:Number(measured.toFixed(3)),status:'valid',source:'ray'};
}
