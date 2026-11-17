import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import * as Blockly from 'blockly';
import {programWorkspace,toFunctionProgram} from '../apps/desktop/renderer/blocks';
import {localizeBlocks} from '../apps/desktop/renderer/block-locale';
import {generateForProject} from '../packages/codegen/project';
import type {FunctionProgram} from '../packages/codegen/functions';
import {arduinoUnoBlocksProgram,arduinoUnoRobotSource,createArduinoUnoBlocksProject,createArduinoUnoRobotProject,hasArduinoUnoRobotWiring} from '../packages/robots/arduino-uno';

const create=()=>createArduinoUnoBlocksProject(crypto.randomUUID(),programWorkspace(arduinoUnoBlocksProgram));

it('creates a code project containing the shipped USB/Bluetooth firmware, without motor activation in setup',()=>{
 const project=createArduinoUnoRobotProject(crypto.randomUUID());
 expect(project.profileId).toBe('arduino-uno');expect(project.mode).toBe('code');
 expect(project.source).toBe(readFileSync('firmware/arduino-uno-robot/arduino-uno-robot.ino','utf8'));
 expect(project.source).toBe(arduinoUnoRobotSource);
 expect(project.source).toContain('COMMAND_TIMEOUT_MS = 350');
 expect(project.source).toContain('while (BT.available()) handleCommand(BT.read())');
 expect(project.source).toContain('while (Serial.available()) handleCommand(Serial.read())');
 const setup=project.source.split('void setup() {')[1]!.split('void loop()')[0]!;
 expect(setup).toContain('stopMotors()');expect(setup).not.toContain('forward()');
});

it('preserves the starter program through real Blockly serialization and generates a single movement followed by stop',()=>{
 const project=create(),workspace=new Blockly.Workspace();
 try{
  Blockly.serialization.workspaces.load(project.workspace,workspace);
  const restored=toFunctionProgram(workspace);
  const source=generateForProject(restored,project);
  expect(source).toContain('j_motor_drive(35, 35)');
  const setup=source.split('void setup() {')[1]!.split('void loop()')[0]!;
  expect(setup.indexOf('j_motor_drive(35, 35)')).toBeLessThan(setup.lastIndexOf('j_motor_stop();'));
  expect(source.split('void loop() {')[1]).not.toContain('j_motor_drive');
  expect(source).toContain('Serial.begin(9600)');expect(source).not.toContain('ledc');
 }finally{workspace.dispose();}
});

it('requires the robot wiring before allowing motor blocks and rejects overlapping roles',()=>{
 const project=create();
 for(const wiring of [{},{...project.wiring,motorSleep:7},{...project.wiring,leftForward:11}])expect(()=>generateForProject(arduinoUnoBlocksProgram,{...project,wiring})).toThrow('MOTOR_WIRING_REQUIRED');
 expect(()=>generateForProject(arduinoUnoBlocksProgram,{...project,profileId:'esp32-devkit-reference'})).toThrow();
 expect(()=>generateForProject(arduinoUnoBlocksProgram,{...project,wiring:{...project.wiring,button:2}})).toThrow('PIN_CONFLICT');
});

it('supports nested loops and function motor commands with cancellable waits',()=>{
 const program:FunctionProgram={setup:[{kind:'call',name:'turn',arguments:[{kind:'number',value:250}]}],loop:[],functions:[{name:'turn',parameters:['duration'],body:[{kind:'repeat',count:2,body:[{kind:'drive',left:-30,right:30},{kind:'waitValue',value:{kind:'variable',name:'duration'}},{kind:'stop'}]}]}]};
 const source=generateForProject(program,create());
 expect(source).toContain('j_motor_drive(-30, 30)');expect(source).toContain('j_wait_ms(jp_duration)');
 expect(source).toContain('if (!j_motor_wait(static_cast<unsigned long>(value))) return false;');
 expect(source).toContain("Serial.read() == 'S'");expect(source).toContain("j_bluetooth.read() == 'S'");
 expect(source).toContain('if (j_motor_stopped) j_motor_stop();');
 expect(source).toContain('j_expression_error = true; j_motor_stop();');
});

it('uses AVR analogWrite for a free PWM pin while preserving ESP32 LEDC',()=>{
 const program={setup:[{kind:'pwm' as const,value:{kind:'number' as const,value:25}}],loop:[]};
 const uno={...create(),wiring:{led:11}};
 const source=generateForProject(program,uno);
 expect(source).toContain('analogWrite(11, duty)');expect(source).toContain('pinMode(11, OUTPUT)');expect(source).not.toContain('ledc');
 expect(generateForProject(program,{...uno,profileId:'esp32-devkit-reference',wiring:{led:4}})).toContain('ledcAttach(4, 1000, 8)');
 expect(()=>generateForProject(program,{...uno,wiring:{led:13}})).toThrow('PWM_PIN_CAPABILITY');
});

it('still rejects unsupported physical sensors and invalid movement values for Arduino',()=>{
 const project=create();
 expect(()=>generateForProject({setup:[{kind:'drive',left:101,right:30}],loop:[]},project)).toThrow('MOTOR_RANGE');
 expect(()=>generateForProject({setup:[{kind:'set',name:'distance',value:{kind:'sensor',sensor:'distance'}}],loop:[]},project)).toThrow('SENSOR_DRIVER_REQUIRED');
});

it('changes only motor captions for the wired Uno and restores simulation captions without changing blocks',()=>{
 const project=create(),workspace=new Blockly.Workspace();
 try{
  Blockly.serialization.workspaces.load(project.workspace,workspace);
  const sensor=workspace.newBlock('jective_sensor');
  const motors=workspace.getAllBlocks(false).filter(block=>['jective_drive','jective_stop'].includes(block.type));
  const original=Blockly.serialization.workspaces.save(workspace);
  expect(hasArduinoUnoRobotWiring(project)).toBe(true);
  expect(hasArduinoUnoRobotWiring({...project,wiring:{}})).toBe(false);
  expect(hasArduinoUnoRobotWiring({...project,profileId:'esp32-devkit-reference'})).toBe(false);
  for(const locale of ['en','ru','kk'] as const){
   localizeBlocks(workspace,locale,true);
   for(const block of motors)expect(block.toString()).not.toMatch(/simulation|симуляция/);
   expect(sensor.toString()).toMatch(/simulation|симуляция/);
   localizeBlocks(workspace,locale,false);
   for(const block of motors)expect(block.toString()).toMatch(/simulation|симуляция/);
  }
  expect(Blockly.serialization.workspaces.save(workspace)).toEqual(original);
 }finally{workspace.dispose();}
});
