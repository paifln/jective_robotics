import type {World,RobotState} from '../../../packages/simulator';
export function drawPixelWorld(canvas:HTMLCanvasElement,world:World,state:RobotState|null,options:{fitArea?:boolean}={}){
 const scene=document.createElement('canvas');scene.width=360;scene.height=270;const ctx=scene.getContext('2d')!;ctx.imageSmoothingEnabled=false;const scale=Math.min(scene.width/world.width,scene.height/world.height);
 ctx.fillStyle='#182337';ctx.fillRect(0,0,360,270);
 for(let y=0;y<world.height*scale;y+=12)for(let x=0;x<world.width*scale;x+=12){ctx.fillStyle=(x/12+y/12)%2?'#95bd72':'#9ec67b';ctx.fillRect(x,y,12,12);ctx.fillStyle='#82ad65';ctx.fillRect(x+3,y+8,2,2);ctx.fillRect(x+8,y+3,2,2);}
 if(world.line.length){ctx.lineCap='square';ctx.lineJoin='miter';ctx.beginPath();world.line.forEach((p,i)=>i?ctx.lineTo(p.x*scale,p.y*scale):ctx.moveTo(p.x*scale,p.y*scale));ctx.strokeStyle='#687583';ctx.lineWidth=18;ctx.stroke();ctx.strokeStyle='#25313d';ctx.lineWidth=5;ctx.stroke();}
 for(const obstacle of world.obstacles){ctx.save();ctx.beginPath();ctx.rect(obstacle.x*scale,obstacle.y*scale,obstacle.width*scale,obstacle.height*scale);ctx.clip();for(let y=obstacle.y*scale;y<(obstacle.y+obstacle.height)*scale;y+=10)for(let x=obstacle.x*scale;x<(obstacle.x+obstacle.width)*scale;x+=16){ctx.fillStyle='#39475c';ctx.fillRect(x,y,16,10);ctx.fillStyle='#70839c';ctx.fillRect(x+1,y+1,14,7);ctx.fillStyle='#91a4b9';ctx.fillRect(x+1,y+1,14,2);}ctx.restore();}
 const gx=Math.round(world.goal.x*scale),gy=Math.round(world.goal.y*scale),radius=world.goal.radius*scale;ctx.save();ctx.beginPath();ctx.arc(gx,gy,radius,0,Math.PI*2);ctx.clip();for(let y=0;y<4;y++)for(let x=0;x<4;x++){ctx.fillStyle=(x+y)%2?'#fff1ab':'#514c43';ctx.fillRect(gx-radius+x*radius/2,gy-radius+y*radius/2,radius/2,radius/2);}ctx.restore();
 const pose=state?.pose??world.start;ctx.save();ctx.translate(Math.round(pose.x*scale),Math.round(pose.y*scale));ctx.rotate(pose.heading);const size=(world.robot?.radius??.12)*scale;ctx.scale(size/8,size/8);drawPixelRobot(ctx,state?.collision);ctx.restore();
 const output=canvas.getContext('2d')!;output.imageSmoothingEnabled=false;output.clearRect(0,0,canvas.width,canvas.height);if(options.fitArea)output.drawImage(scene,0,0,world.width*scale,world.height*scale,0,0,canvas.width,canvas.height);else output.drawImage(scene,0,0,canvas.width,canvas.height);
}

export function drawPixelRobot(ctx:CanvasRenderingContext2D,collision=false){
 // The nose points along +X, the same direction as heading zero.
 ctx.fillStyle='#172437';
 for(const x of [-8,2]){
  for(const y of [-9,5]){
   ctx.fillRect(x,y+1,6,2);
   ctx.fillRect(x+1,y,4,4);
   ctx.fillStyle='#47576e';
   ctx.fillRect(x+1,y+1,1,2);
   ctx.fillRect(x+4,y+1,1,2);
   ctx.fillStyle='#172437';
  }
 }

 // Flat chassis with a cutout in the front plate.
 ctx.beginPath();
 ctx.moveTo(-9,-3);
 ctx.lineTo(-6,-6);
 ctx.lineTo(6,-6);
 ctx.lineTo(9,-4);
 ctx.lineTo(9,4);
 ctx.lineTo(6,6);
 ctx.lineTo(-6,6);
 ctx.lineTo(-9,3);
 ctx.closePath();
 ctx.moveTo(5,-3);
 ctx.lineTo(7,-3);
 ctx.lineTo(8,-2);
 ctx.lineTo(8,2);
 ctx.lineTo(7,3);
 ctx.lineTo(5,3);
 ctx.closePath();
 ctx.fillStyle=collision?'#ef7575':'#8eb7ff';
 ctx.fill('evenodd');

 // Separate rear battery tray and exposed controller board.
 ctx.fillStyle='#193453';
 ctx.fillRect(-8,-4,5,8);
 ctx.fillStyle='#5590eb';
 for(const y of [-3,-1,1,3])ctx.fillRect(-7,y,3,1);
 ctx.fillStyle='#245ed0';
 ctx.fillRect(-2,-5,7,10);
 ctx.fillStyle='#162c51';
 ctx.fillRect(0,-2,3,4);
 ctx.fillStyle='#a9d9ff';
 ctx.fillRect(-1,-4,5,1);
 ctx.fillRect(-1,3,5,1);
 ctx.fillStyle='#e1f5ff';
 ctx.fillRect(8,-1,1,2);
}
