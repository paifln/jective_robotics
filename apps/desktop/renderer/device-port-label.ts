import type {Device} from '../../../packages/contracts';
import type {Locale} from './locale';

export function devicePortLabel(port:Device,locale:Locale):string{
 const name=port.bluetoothName||port.friendlyName||port.manufacturer;
 const parts=[port.path];if(name)parts.push(name);
 if(port.transport==='usb')parts.push('USB');
 if(port.transport==='bluetooth')parts.push('Bluetooth');
 if(port.bluetoothDirection==='incoming')parts.push(locale==='ru'?'входящий':locale==='kk'?'кіріс':'incoming');
 if(port.bluetoothDirection==='outgoing')parts.push(locale==='ru'?'исходящий':locale==='kk'?'шығыс':'outgoing');
 return parts.join(' · ');
}

export function canUseWirelessPort(port:Device):boolean{
 return port.transport!=='usb'&&port.bluetoothDirection!=='incoming';
}

/** Only select a uniquely named HC-05; COM numbers can change after pairing. */
export function preferredWirelessPort(ports:Device[],previous=''):string{
 if(ports.some(port=>port.path===previous&&canUseWirelessPort(port)))return previous;
 const matches=ports.filter(port=>canUseWirelessPort(port)&&/\bhc[\s_-]?05\b/i.test(port.bluetoothName||port.friendlyName||''));
 return matches.length===1?matches[0]!.path:'';
}
