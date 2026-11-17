import {describe,expect,it,vi} from 'vitest';
import {createBluetoothNameLookup,identifySerialPort,parseBluetoothFriendlyName} from '../packages/devices/port-identity';

const outgoing=(address:string)=>`BTHENUM\\{00001101-0000-1000-8000-00805F9B34FB}_LOCALMFG&08E7\\8&146B2434&0&${address}_C00000000`;

describe('serial port identity',()=>{
 it('distinguishes the USB cable from the named Bluetooth robot and other paired devices',async()=>{
  const lookup=vi.fn(async(address:string)=>({'98D371F62C6D':'HC-05','F85B6E8EE473':'Galaxy Buds2 (E473)'}[address]));
  const options={platform:'win32' as const,lookupBluetoothName:lookup};
  await expect(identifySerialPort({pnpId:'USB\\VID_1A86&PID_7523\\6&2838F1DC&0&1',friendlyName:'USB-SERIAL CH340 (COM5)'},options)).resolves.toEqual({transport:'usb',friendlyName:'USB-SERIAL CH340 (COM5)'});
  expect(lookup).not.toHaveBeenCalled();
  await expect(identifySerialPort({pnpId:outgoing('98D371F62C6D'),friendlyName:'Bluetooth serial (COM3)'},options)).resolves.toEqual({transport:'bluetooth',friendlyName:'Bluetooth serial (COM3)',bluetoothDirection:'outgoing',bluetoothName:'HC-05'});
  await expect(identifySerialPort({pnpId:outgoing('F85B6E8EE473')},options)).resolves.toMatchObject({bluetoothName:'Galaxy Buds2 (E473)',bluetoothDirection:'outgoing'});
  expect(lookup.mock.calls).toEqual([['98D371F62C6D'],['F85B6E8EE473']]);
 });

 it('does not guess names for incoming ports or unfamiliar Bluetooth identifiers',async()=>{
  const lookup=vi.fn(async()=>undefined);const options={platform:'win32' as const,lookupBluetoothName:lookup};
  for(const suffix of ['00000000','0000001F']){
   await expect(identifySerialPort({pnpId:`BTHENUM\\service\\8&146B2434&0&000000000000_${suffix}`},options)).resolves.toEqual({transport:'bluetooth',bluetoothDirection:'incoming'});
  }
  for(const pnpId of ['BTHENUM\\unknown',outgoing('bad\\path'),outgoing('000000000000'),'BTHENUM\\service\\8&0&98D371F62C6D_00000000']){
   await expect(identifySerialPort({pnpId},options)).resolves.toEqual({transport:'bluetooth',bluetoothDirection:'unknown'});
  }
  expect(lookup).not.toHaveBeenCalled();
  await expect(identifySerialPort({},options)).resolves.toEqual({transport:'unknown'});
 });

 it('skips registry lookups outside Windows and tolerates lookup failure',async()=>{
  const lookup=vi.fn(async()=>{throw new Error('Registry unavailable');});const port={pnpId:outgoing('ABCDEF012345')};
  await expect(identifySerialPort(port,{platform:'linux',lookupBluetoothName:lookup})).resolves.toEqual({transport:'bluetooth',bluetoothDirection:'outgoing'});
  expect(lookup).not.toHaveBeenCalled();
  await expect(identifySerialPort(port,{platform:'win32',lookupBluetoothName:lookup})).resolves.toEqual({transport:'bluetooth',bluetoothDirection:'outgoing'});
 });

 it('extracts one unambiguous registry name and ignores malformed output',()=>{
  expect(parseBluetoothFriendlyName('HKEY_LOCAL_MACHINE\\device\r\n    FriendlyName    REG_SZ    HC-05\r\n\r\nEnd of search: 1 match(es) found.')).toBe('HC-05');
  expect(parseBluetoothFriendlyName(' FriendlyName REG_SZ Galaxy Buds2 (E473)\n FriendlyName REG_SZ Galaxy Buds2 (E473)')).toBe('Galaxy Buds2 (E473)');
  expect(parseBluetoothFriendlyName(' FriendlyName REG_SZ Robot\n FriendlyName REG_SZ Other')).toBeUndefined();
  expect(parseBluetoothFriendlyName(' FriendlyName REG_BINARY 48433035')).toBeUndefined();
  expect(parseBluetoothFriendlyName(` FriendlyName REG_SZ ${'x'.repeat(201)}`)).toBeUndefined();
 });
});

describe('Bluetooth name cache',()=>{
 it('shares concurrent queries, normalizes addresses and refreshes after thirty seconds',async()=>{
  let now=100;let finish!:(name:string)=>void;
  const query=vi.fn(()=>new Promise<string>(resolve=>{finish=resolve;}));const lookup=createBluetoothNameLookup(query,()=>now);
  const first=lookup('abcdef012345');const second=lookup('ABCDEF012345');
  expect(second).toBe(first);await Promise.resolve();expect(query).toHaveBeenCalledExactlyOnceWith('ABCDEF012345');
  finish('HC-05');await expect(first).resolves.toBe('HC-05');
  now+=29_999;await expect(lookup('ABCDEF012345')).resolves.toBe('HC-05');expect(query).toHaveBeenCalledTimes(1);
  now+=1;const refresh=lookup('ABCDEF012345');await Promise.resolve();expect(query).toHaveBeenCalledTimes(2);finish('Renamed robot');await expect(refresh).resolves.toBe('Renamed robot');
 });

 it('rejects unsafe addresses, retries failures and bounds cached devices',async()=>{
  const query=vi.fn(async()=>undefined as string|undefined);const lookup=createBluetoothNameLookup(query);
  for(const invalid of ['000000000000','ABCDEF012345\\other','ABCDEF01234','ABCDEF01234G'])await expect(lookup(invalid)).resolves.toBeUndefined();
  expect(query).not.toHaveBeenCalled();
  query.mockRejectedValueOnce(new Error('Unavailable'));await expect(lookup('000000000001')).resolves.toBeUndefined();
  query.mockResolvedValue('Robot');await expect(lookup('000000000001')).resolves.toBe('Robot');expect(query).toHaveBeenCalledTimes(2);
  for(let index=2;index<=65;index++)await lookup(index.toString(16).padStart(12,'0'));
  await lookup('000000000001');expect(query).toHaveBeenCalledTimes(67);
 });
});
