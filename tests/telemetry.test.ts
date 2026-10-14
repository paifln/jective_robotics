import {it,expect} from 'vitest';
import {collectTelemetry,telemetryCsv} from '../packages/devices/telemetry';
import type {SerialEvent} from '../packages/contracts';
const sample=(seq:number,id='00000000-0000-4000-8000-000000000001'):SerialEvent=>({timestamp:new Date(1000+seq).toISOString(),kind:'protocol',text:JSON.stringify({v:1,type:'telemetry',seq,values:{distance:seq}}),connection:{id,port:'EXPLICIT_FIXTURE',baud:115200}});
it('telemetry keeps unknown provenance explicit and ignores raw text and nonmeasurement protocol frames',()=>{
 const event=sample(0);delete event.connection;
 const data=collectTelemetry([event,{...sample(1),kind:'raw',text:'{"distance":999}'},{...sample(2),text:JSON.stringify({v:1,type:'ack',seq:2,commandId:'fixture'})}]);
 expect(data.series).toHaveLength(1);expect(data.series[0]).toMatchObject({connectionId:'unknown',port:'unknown',metric:'distance'});expect(data.series[0]!.points.map(p=>p.value)).toEqual([0]);expect(data.rejected).toBe(0);
 expect(telemetryCsv(data.series[0]!,'')).toContain('"unknown","unknown","distance","unknown"');
});
it('telemetry only reads the most recent event window and does not carry an older connection into it',()=>{
 const older=sample(0,'00000000-0000-4000-8000-000000000099');
 const data=collectTelemetry([older,...Array.from({length:1000},(_,index)=>({...sample(index),kind:'status' as const,text:'status fixture'}))]);
 expect(data).toEqual({series:[],rejected:0,dropped:0});
});
it('telemetry separates connections, rejects malformed values and bounds retained samples',()=>{
 const data=collectTelemetry([...Array.from({length:300},(_,i)=>sample(i)),sample(1,'00000000-0000-4000-8000-000000000002'),{...sample(1),text:'invalid JSON'}, {...sample(2),timestamp:'invalid time'}]);
 expect(data.series).toHaveLength(2);expect(data.series[0]!.points).toHaveLength(256);expect(data.series[0]!.points[0]!.seq).toBe(44);expect(data.rejected).toBe(2);expect(data.dropped).toBe(44);
 const csv=telemetryCsv(data.series[0]!,'=FORMULA');expect(csv).toContain('serial-receipt');expect(csv).toContain('user annotation; not device-verified');expect(csv).toContain("'=FORMULA");
});
it('telemetry reports series overflow and rejects absent measurements rather than fabricating zero',()=>{
 const many={...sample(1),text:JSON.stringify({v:1,type:'telemetry',seq:1,values:Object.fromEntries(Array.from({length:40},(_,i)=>['metric'+i,i]))})};
 const missing={...sample(2),text:JSON.stringify({v:1,type:'telemetry',seq:2,values:{distance:null}})};
 const data=collectTelemetry([many,missing]);expect(data.series).toHaveLength(32);expect(data.dropped).toBe(8);expect(data.rejected).toBe(1);expect(data.series.every(s=>s.points.length===1)).toBe(true);
});
