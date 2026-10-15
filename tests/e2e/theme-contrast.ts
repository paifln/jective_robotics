import {expect,type Locator} from '@playwright/test';

/** Verify rendered readability without coupling tests to a particular palette. */
export async function expectReadableControl(control:Locator){
 await expect.poll(async()=>control.evaluate(element=>{
  const rgb=(value:string)=>value.match(/[\d.]+/g)?.map(Number);
  const luminance=(channels:number[])=>channels.slice(0,3).map(value=>{
   const normalized=value/255;return normalized<=0.04045?normalized/12.92:((normalized+0.055)/1.055)**2.4;
  }).reduce((sum,value,index)=>sum+value*[0.2126,0.7152,0.0722][index]!,0);
  const foreground=rgb(getComputedStyle(element).color);let background:number[]|undefined;
  for(let parent:Element|null=element;parent;parent=parent.parentElement){
   const candidate=rgb(getComputedStyle(parent).backgroundColor);
   if(candidate&&candidate.length>=3&&(candidate.length===3||candidate[3]===1)){background=candidate;break;}
  }
  if(!foreground||!background)return 0;
  const light=luminance(foreground),dark=luminance(background);
  return (Math.max(light,dark)+0.05)/(Math.min(light,dark)+0.05);
 })).toBeGreaterThanOrEqual(4.5);
}

export async function expectDarkControl(control:Locator){
 await expect(control.page().locator('body')).toHaveAttribute('data-theme','dark');
 await expectReadableControl(control);
}
