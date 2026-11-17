import {SerialPort} from 'serialport';
import type {Device} from '../contracts';
import {WindowsBluetoothPort} from './windows-bluetooth-port';

export type DevicePort=SerialPort|WindowsBluetoothPort;

export function createDevicePort(device:Device,baudRate:number,platform:NodeJS.Platform=process.platform):DevicePort{
 // Windows Bluetooth SPP can hang in the native binding's overlapped I/O.
 // System.IO.Ports uses the Windows serial path confirmed by the robot handshake.
 return platform==='win32'&&device.transport==='bluetooth'
  ?new WindowsBluetoothPort({path:device.path,baudRate})
  :new SerialPort({path:device.path,baudRate,autoOpen:false});
}
