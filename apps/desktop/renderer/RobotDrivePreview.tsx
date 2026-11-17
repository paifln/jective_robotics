import React,{useEffect,useRef} from 'react';
import type {ArduinoCommand} from '../../../packages/contracts/arduino-robot';
import {drawPixelRobot} from './pixel-world';

const width=360;
const height=240;
const margin=32;
const speed=140;
const directions={
 F:{x:0,y:-1,heading:-Math.PI/2},
 B:{x:0,y:1,heading:-Math.PI/2},
 L:{x:-1,y:0,heading:Math.PI},
 R:{x:1,y:0,heading:0},
};

export function RobotDrivePreview({command,label}:{command:ArduinoCommand;label:string}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const pose=useRef({x:width/2,y:height/2,heading:-Math.PI/2});

 useEffect(()=>{
  const ctx=canvas.current?.getContext('2d');
  if(!ctx)return;
  const robot=pose.current;
  const draw=()=>{
   ctx.clearRect(0,0,width,height);
   ctx.save();
   ctx.translate(Math.round(robot.x),Math.round(robot.y));
   ctx.rotate(robot.heading);
   ctx.scale(3,3);
   drawPixelRobot(ctx);
   ctx.restore();
  };

  if(command==='S'){draw();return;}
  const direction=directions[command];
  robot.heading=direction.heading;
  draw();
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;

  let previous=performance.now();
  let frame=requestAnimationFrame(advance);
  function advance(now:number){
   const distance=Math.min(Math.max(0,now-previous),50)*speed/1000;
   previous=now;
   robot.x=Math.max(margin,Math.min(width-margin,robot.x+direction.x*distance));
   robot.y=Math.max(margin,Math.min(height-margin,robot.y+direction.y*distance));
   draw();
   frame=requestAnimationFrame(advance);
  }
  return()=>cancelAnimationFrame(frame);
 },[command]);

 return <figure className="arduino-drive-preview">
  <canvas ref={canvas} width={width} height={height} aria-hidden="true"/>
  <figcaption>{label}</figcaption>
 </figure>;
}
