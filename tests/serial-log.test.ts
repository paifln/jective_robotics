import {it,expect} from 'vitest';
import {exportSerialLog} from '../packages/devices/log';
it('serial export rejects excessive histories and invalid timestamp records',()=>{
 const event={timestamp:'2026-10-10T12:00:00.000Z',kind:'raw' as const,text:'fixture'};
 expect(()=>exportSerialLog(Array.from({length:1001},()=>event),{filter:'',paused:false})).toThrow('SERIAL_EXPORT_LIMIT');
 expect(()=>exportSerialLog([{...event,timestamp:'invalid'}],{filter:'',paused:false})).toThrow();
});
it('serial evidence retains per-connection provenance and marks receipt clocks without inventing physical verification',()=>{
 const log=exportSerialLog([{timestamp:'2026-10-10T12:00:00.000Z',kind:'raw',text:'MOTOR_MOVED',connection:{id:'00000000-0000-4000-8000-000000000001',port:'COM7',baud:115200}},{timestamp:'2026-10-10T12:01:00.000Z',kind:'error',text:'Fixture without metadata\nOrigin: SIMULATION'}],{filter:'',paused:true});
 expect(log).toContain('Origin: SERIAL MONITOR');expect(log).toContain('desktop receipt');expect(log).toContain('"port":"COM7"');expect(log).toContain('"paused":true');expect(log).toContain('[error] null');expect(log).toContain('metadata means the event source port is unknown');expect(log).not.toContain('\nOrigin: SIMULATION');
});
