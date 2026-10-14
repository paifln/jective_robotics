import {SerialEventSchema,type SerialEvent} from '../contracts';
export function exportSerialLog(events:SerialEvent[],options:{filter:string;paused:boolean}){
 if(events.length>1000)throw new Error('SERIAL_EXPORT_LIMIT');
 const validated=events.map(event=>SerialEventSchema.parse(event));
 return [
  'Origin: SERIAL MONITOR — desktop receipt events; not simulation.',
  'Clock: desktop receipt/status timestamp; not an authenticated device event time.',
  'Evidence: raw text and protocol fields do not independently prove physical movement or firmware identity.',
  'View: '+JSON.stringify(options),
  'Missing connection metadata means the event source port is unknown; current selection is not substituted.',
  ...validated.map(e=>`${e.timestamp} [${e.kind}] ${JSON.stringify(e.connection??null)} ${JSON.stringify(e.text)}`)
 ].join('\n')+'\n';
}
