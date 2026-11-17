import {beforeEach,describe,expect,it,vi} from 'vitest';

const factories=vi.hoisted(()=>({native:vi.fn(),bluetooth:vi.fn()}));
vi.mock('serialport',()=>({SerialPort:class{constructor(options:unknown){factories.native(options);}}}));
vi.mock('../packages/devices/windows-bluetooth-port',()=>({WindowsBluetoothPort:class{constructor(options:unknown){factories.bluetooth(options);}}}));
import {createDevicePort} from '../packages/devices/serial-port';

beforeEach(()=>{vi.clearAllMocks();});
describe('serial port transport selection',()=>{
 it('uses the Windows bridge for Bluetooth based on identity rather than COM number',()=>{
  createDevicePort({path:'COM21',transport:'bluetooth'},9600,'win32');
  expect(factories.bluetooth).toHaveBeenCalledExactlyOnceWith({path:'COM21',baudRate:9600});
  expect(factories.native).not.toHaveBeenCalled();
 });
 it('keeps USB and unknown ports on the native binding',()=>{
  for(const transport of ['usb','unknown'] as const)createDevicePort({path:'COM3',transport},115200,'win32');
  createDevicePort({path:'FAKE_TEST'},9600,'win32');
  expect(factories.bluetooth).not.toHaveBeenCalled();expect(factories.native).toHaveBeenCalledTimes(3);
  expect(factories.native).toHaveBeenLastCalledWith({path:'FAKE_TEST',baudRate:9600,autoOpen:false});
 });
 it('preserves the native binding on other operating systems',()=>{
  createDevicePort({path:'/dev/rfcomm0',transport:'bluetooth'},9600,'linux');
  expect(factories.bluetooth).not.toHaveBeenCalled();
  expect(factories.native).toHaveBeenCalledExactlyOnceWith({path:'/dev/rfcomm0',baudRate:9600,autoOpen:false});
 });
});
