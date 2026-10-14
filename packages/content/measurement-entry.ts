import {describeEnteredMeasurements} from './sensor-uncertainty';
/** One reading per line; decimal comma is accepted, an unavailable reading is '?'. */
export function parseMeasurementEntry(text:string,referenceMeters:number){
 if(typeof text!=='string'||text.length>12000)throw new Error('MEASUREMENT_TEXT_LIMIT');
 const lines=text.trim().split(/\r?\n/);
 if(lines.length<1||lines.length>300||lines.some(line=>line.trim()===''))throw new Error('MEASUREMENT_LINE_COUNT');
 const readings=lines.map(line=>{
  const value=line.trim();if(value==='?')return null;
  if(!/^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(value))throw new Error('MEASUREMENT_FORMAT');
  return Number(value.replace(',','.'));
 });
 return describeEnteredMeasurements({referenceMeters,readings});
}
