import {describe,expect,it} from 'vitest';
import type {Device} from '../packages/contracts';
import {DeviceSchema} from '../packages/contracts';
import {canUseWirelessPort,devicePortLabel,preferredWirelessPort} from '../apps/desktop/renderer/device-port-label';

const ports:Device[]=[
 {path:'COM5',transport:'usb',friendlyName:'USB-SERIAL CH340'},
 {path:'COM6',transport:'bluetooth',bluetoothDirection:'incoming'},
 {path:'COM13',transport:'bluetooth',bluetoothDirection:'outgoing',bluetoothName:'Galaxy Buds2'},
 {path:'COM3',transport:'bluetooth',bluetoothDirection:'outgoing',bluetoothName:'HC-05'},
];

describe('robot COM port choice',()=>{
 it('preserves metadata through the IPC schema and labels the actual Bluetooth device',()=>{
  const port=DeviceSchema.parse(ports[3]);
  expect(devicePortLabel(port,'ru')).toBe('COM3 · HC-05 · Bluetooth · исходящий');
  expect(devicePortLabel(ports[0]!,'en')).toBe('COM5 · USB-SERIAL CH340 · USB');
  expect(devicePortLabel(ports[1]!,'ru')).toContain('входящий');
 });
 it('selects HC-05 by device name rather than by COM number or list order',()=>{
  expect(preferredWirelessPort(ports)).toBe('COM3');
  expect(preferredWirelessPort([{...ports[3]!,path:'COM21'}])).toBe('COM21');
  expect(preferredWirelessPort(ports,'COM5')).toBe('COM3');
  expect(preferredWirelessPort(ports,'COM6')).toBe('COM3');
 });
 it('does not choose earbuds, guess between two robots or override a valid manual choice',()=>{
  expect(preferredWirelessPort(ports.slice(0,3))).toBe('');
  expect(preferredWirelessPort([...ports,{...ports[3]!,path:'COM21'}])).toBe('');
  expect(preferredWirelessPort([...ports,{path:'custom'}],'custom')).toBe('custom');
  expect(preferredWirelessPort(ports,'COM99')).toBe('COM3');
 });
 it('allows unidentified adapters but excludes known USB and incoming Bluetooth ports',()=>{
  expect(ports.map(canUseWirelessPort)).toEqual([false,false,true,true]);
  expect(canUseWirelessPort({path:'/dev/rfcomm0'})).toBe(true);
  expect(devicePortLabel({path:'custom',manufacturer:'Adapter'},'en')).toBe('custom · Adapter');
 });
});
