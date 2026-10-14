import {FrameSchema} from './protocol';
import type {SerialEvent} from '../contracts';
import {csvCell} from '../persistence/csv';
export interface TelemetryPoint {timestamp:string;receiptMs:number;seq:number;value:number}
export interface TelemetrySeries {id:string;metric:string;connectionId:string;port:string;points:TelemetryPoint[]}
export function collectTelemetry(events:SerialEvent[]){
 const series=new Map<string,TelemetrySeries>();let rejected=0,dropped=0;
 for(const event of events.slice(-1000)){
  if(event.kind!=='protocol')continue;
  let frame;try{frame=FrameSchema.parse(JSON.parse(event.text));}catch{rejected++;continue;}
  if(frame.type!=='telemetry')continue;const receiptMs=Date.parse(event.timestamp);if(!Number.isFinite(receiptMs)){rejected++;continue;}
  for(const [metric,value] of Object.entries(frame.values)){
   const connectionId=event.connection?.id??'unknown',id=JSON.stringify([connectionId,metric]);let item=series.get(id);
   if(!item){if(series.size>=32){dropped++;continue;}item={id,metric,connectionId,port:event.connection?.port??'unknown',points:[]};series.set(id,item);}
   item.points.push({timestamp:event.timestamp,receiptMs,seq:frame.seq,value});if(item.points.length>256){item.points.shift();dropped++;}
  }
 }
 return {series:[...series.values()],rejected,dropped};
}
export function telemetryCsv(series:TelemetrySeries,unit:string){
 const rows=[['origin','clock','connection_id','port','metric','unit_annotation','unit_source','receipt_timestamp','sequence','value'],...series.points.map(p=>['serial-receipt','desktop receipt',series.connectionId,series.port,series.metric,unit||'unknown','user annotation; not device-verified',p.timestamp,p.seq,p.value])];
 return rows.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
