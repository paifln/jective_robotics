import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {arduinoWirelessRuntimeSource,createArduinoWirelessRuntimeProject} from '../packages/robots/arduino-wireless';
import {wirelessProgramChecksum} from '../packages/contracts/arduino-wireless';

it('ships the exact one-time firmware as an editable Uno project with the existing wiring',()=>{
 const project=createArduinoWirelessRuntimeProject(crypto.randomUUID());
 expect(project.profileId).toBe('arduino-uno');expect(project.mode).toBe('code');
 expect(project.source).toBe(readFileSync('firmware/arduino-uno-wireless/arduino-uno-wireless.ino','utf8'));
 expect(project.source).toBe(arduinoWirelessRuntimeSource);
 expect(project.wiring).toMatchObject({bluetoothRx:2,bluetoothTx:3,motorSleep:4,leftForward:5,leftReverse:6,rightForward:9,rightReverse:10});
});

it('shares the native firmware harness golden CRC including signed motor duty and 60000ms waits',()=>{
 expect(wirelessProgramChecksum({version:1,steps:[{op:'m',a:-255,b:255},{op:'w',a:60000,b:0},{op:'l',a:1,b:0},{op:'s',a:0,b:0}],loopStart:1})).toBe(63613);
 const harness=readFileSync('tests/firmware/arduino_wireless_test.cpp','utf8');
 expect(harness).toContain('assert(referenceCrc(golden, 4, 1) == 63613)');
});
