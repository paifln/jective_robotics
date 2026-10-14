import {lineReflectance,WorldSchema} from '../simulator';
export function parseReflectanceSamples(text:string):number[]{
 if(typeof text!=='string'||text.length>10000)throw new Error('LINE_SAMPLE_TEXT');
 const lines=text.trim().split(/\r?\n/).map(line=>line.trim());
 if(lines.length<3||lines.length>100||!lines.every(line=>/^(?:0(?:[.,]\d+)?|1(?:[.,]0+)?)$/.test(line)))throw new Error('LINE_SAMPLE_TEXT');
 return lines.map(line=>Number(line.replace(',','.')));
}
export function calibrateLine(dark:readonly number[],light:readonly number[]){
 const valid=(values:readonly number[])=>values.length>=3&&values.length<=100&&values.every(value=>Number.isFinite(value)&&value>=0&&value<=1);
 if(!valid(dark)||!valid(light))throw new Error('LINE_CALIBRATION_SAMPLES');
 const darkMaximum=Math.max(...dark),lightMinimum=Math.min(...light),separated=darkMaximum<lightMinimum;
 return {schemaVersion:1,dark:[...dark],light:[...light],darkMaximum,lightMinimum,separated,
  threshold:separated?(darkMaximum+lightMinimum)/2:null,
  assumptions:'Lower reflectance is dark. Limits describe supplied samples only; not a statistical guarantee or physical sensor calibration.'} as const;
}
export function classifyLine(value:number|null,calibration:ReturnType<typeof calibrateLine>):'dark'|'light'|'uncertain'{
 if(value===null||!Number.isFinite(value)||value<0||value>1||!calibration.separated)return 'uncertain';
 if(value<=calibration.darkMaximum)return 'dark';
 if(value>=calibration.lightMinimum)return 'light';
 return 'uncertain';
}
export function justifyLineThreshold(dark:readonly number[],light:readonly number[],selectedThreshold:number,justification:string){
 const calibration=calibrateLine(dark,light);
 if(!calibration.separated||!Number.isFinite(selectedThreshold)||selectedThreshold<=calibration.darkMaximum||selectedThreshold>=calibration.lightMinimum)throw new Error('LINE_THRESHOLD_NOT_SEPARATING');
 if(typeof justification!=='string'||justification.trim().length<10||justification.length>2000)throw new Error('LINE_THRESHOLD_JUSTIFICATION');
 return {schemaVersion:1,calibration,selectedThreshold,justification:justification.trim(),uncertainStrategy:'Retain values between observed dark maximum and light minimum as uncertain; midpoint or selected threshold alone does not resolve this gap',physicalVerification:'NOT RUN'} as const;
}
export function lineCalibrationExample(){
 const world=WorldSchema.parse({id:'L27-reflectance-samples',width:2,height:2,start:{x:.5,y:.5,heading:0},goal:{x:1.5,y:1.5,radius:.1},obstacles:[],line:[{x:.2,y:1},{x:1.8,y:1}]});
 const darkPoints=[{x:.4,y:1},{x:1,y:1},{x:1.6,y:1}],lightPoints=[{x:.4,y:.9},{x:1,y:.9},{x:1.6,y:.9}];
 const samples=(points:typeof darkPoints)=>points.map(point=>({...point,reflectance:lineReflectance(world,point.x,point.y)}));
 const dark=samples(darkPoints),light=samples(lightPoints);
 return {origin:'simulation',world,dark,light,calibration:calibrateLine(dark.map(sample=>sample.reflectance),light.map(sample=>sample.reflectance)),physicalVerification:'NOT RUN'} as const;
}
