import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {ProtocolParser} from '../packages/devices';
import {connectionAnnouncement,inspectAnnouncement,runtimeAnnouncementRequirements} from '../packages/devices/announcement';
import type {SerialEvent} from '../packages/contracts';
const profile='esp32-devkit-reference',connection={id:'5c907c7b-68ea-4a5d-8f9f-391ecb03b51c',port:'COM-FIXTURE',baud:115200 as const},hello={v:1,type:'hello',firmware:'0.1.0',profile,device:'explicit-test-fixture',session:'explicit-test-session',capabilities:['motor-limited','heartbeat-challenge']};
const event=(value:unknown,change:Partial<SerialEvent>={}):SerialEvent=>({timestamp:'2026-10-11T14:00:00.000Z',kind:'protocol',text:JSON.stringify(value),connection,...change});
it('compares the actual runtime announcement requirements without treating advertised fields as physical proof',()=>{
 const source=readFileSync('firmware/jective-runtime/JectiveRuntime.h','utf8');expect(source).toContain('\\"firmware\\":\\"'+runtimeAnnouncementRequirements.firmware+'\\"');for(const capability of runtimeAnnouncementRequirements.capabilities)expect(source).toContain(capability);
 expect(inspectAnnouncement(hello,profile)?.state).toBe('matching-announcement');expect(inspectAnnouncement({...hello,firmware:'9.0',profile:'other',capabilities:[]},profile)?.issues).toEqual(['firmware','profile','capabilities']);expect(inspectAnnouncement({...hello,v:99},profile)?.state).toBe('invalid-protocol');expect(inspectAnnouncement({v:1,type:'challenge',nonce:1},profile)).toBeNull();
});
it('does not borrow an old connection, another port or identity-free raw text',()=>{
 expect(connectionAnnouncement([event(hello)],null,profile).state).toBe('closed');expect(connectionAnnouncement([event(hello)],'COM-OTHER',profile).state).toBe('not-observed');expect(connectionAnnouncement([event(hello,{connection:undefined})],connection.port,profile).state).toBe('not-observed');
 const raw=event(null,{kind:'raw',text:'READY'}),newConnection={...connection,id:'bc90638d-3553-4ff0-9b80-86097304027e'};expect(connectionAnnouncement([event(hello),{...raw,connection:newConnection}],connection.port,profile).state).toBe('not-observed');expect(connectionAnnouncement([event(hello),raw],connection.port,'other').issues).toEqual(['profile']);
 expect(connectionAnnouncement([event(hello),event(null,{kind:'status',text:'Serial disconnected; motion authority is not restored automatically'}),event(hello)],connection.port,profile).state).toBe('closed');
});
it('uses actual bounded parser output and rejects malformed/newer protocol input',()=>{
 const parser=new ProtocolParser(),events=parser.feed('@JECTIVE '+JSON.stringify(hello)+'\n').map(e=>({...e,connection}));expect(connectionAnnouncement(events,connection.port,profile).state).toBe('matching-announcement');const invalid=parser.feed('@JECTIVE {"v":99}\n').map(e=>({...e,connection}));expect(connectionAnnouncement([...events,...invalid],connection.port,profile).state).toBe('invalid-protocol');expect(connectionAnnouncement([event('not-json',{text:'{'})],connection.port,profile).state).toBe('invalid-protocol');expect(connectionAnnouncement([event({v:1,type:'ack',seq:1,commandId:'1'})],connection.port,profile).state).toBe('not-observed');expect(connectionAnnouncement([event(hello),...Array.from({length:1001},()=>event(null,{kind:'raw',text:'later'}))],connection.port,profile).state).toBe('not-observed');
});
