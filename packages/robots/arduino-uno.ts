import {ProjectSchema} from '../contracts';
import type {Program} from '../codegen';
import {generateForProject} from '../codegen/project';
import {arduinoUnoRobotWiring} from '../codegen/arduino-uno-driver';
export {hasArduinoUnoRobotWiring} from '../codegen/arduino-uno-driver';

export const arduinoUnoRobotSource = `#include <SoftwareSerial.h>

const byte BT_RX = 2;
const byte BT_TX = 3;
const byte SLP = 4;
const byte AIN1 = 5;
const byte AIN2 = 6;
const byte BIN1 = 9;
const byte BIN2 = 10;

SoftwareSerial BT(BT_RX, BT_TX);
int motorSpeed = 200;
const unsigned long COMMAND_TIMEOUT_MS = 350;
unsigned long lastCommandAt = 0;
bool moving = false;

void stopMotors() {
  analogWrite(AIN1, 0); analogWrite(AIN2, 0);
  analogWrite(BIN1, 0); analogWrite(BIN2, 0);
  moving = false;
}

void drive(int leftSpeed, int rightSpeed) {
  stopMotors();
  leftSpeed = constrain(leftSpeed, -255, 255);
  rightSpeed = constrain(rightSpeed, -255, 255);
  analogWrite(AIN1, leftSpeed > 0 ? leftSpeed : 0);
  analogWrite(AIN2, leftSpeed < 0 ? -leftSpeed : 0);
  analogWrite(BIN1, rightSpeed > 0 ? rightSpeed : 0);
  analogWrite(BIN2, rightSpeed < 0 ? -rightSpeed : 0);
  moving = leftSpeed != 0 || rightSpeed != 0;
}

void forward() { drive(motorSpeed, motorSpeed); }
void backward() { drive(-motorSpeed, -motorSpeed); }
void left() { drive(-motorSpeed, motorSpeed); }
void right() { drive(motorSpeed, -motorSpeed); }

void handleCommand(char command) {
  switch (command) {
    case 'F': forward(); break;
    case 'B': backward(); break;
    case 'L': left(); break;
    case 'R': right(); break;
    case 'S': stopMotors(); break;
    default: return;
  }
  lastCommandAt = millis();
}

void setup() {
  pinMode(SLP, OUTPUT);
  digitalWrite(SLP, LOW);
  pinMode(AIN1, OUTPUT); pinMode(AIN2, OUTPUT);
  pinMode(BIN1, OUTPUT); pinMode(BIN2, OUTPUT);
  stopMotors();
  digitalWrite(SLP, HIGH);
  Serial.begin(9600);
  BT.begin(9600);
  Serial.println("ROBOT READY");
}

void loop() {
  while (BT.available()) handleCommand(BT.read());
  while (Serial.available()) handleCommand(Serial.read());
  if (moving && millis() - lastCommandAt >= COMMAND_TIMEOUT_MS) stopMotors();
}
`;

export const arduinoUnoBlocksProgram:Program = {
 setup:[{kind:'wait',ms:1000},{kind:'drive',left:35,right:35},{kind:'wait',ms:500},{kind:'stop'}],
 loop:[]
};

export function createArduinoUnoRobotProject(id:string,name='Arduino Uno — управление') {
 return ProjectSchema.parse({schemaVersion:1,id,name,profileId:'arduino-uno',mode:'code',source:arduinoUnoRobotSource,workspace:{},revision:0,wiring:{...arduinoUnoRobotWiring}});
}

export function createArduinoUnoBlocksProject(id:string,workspace:Record<string,unknown>,name='Arduino Uno — программа робота') {
 const project=ProjectSchema.parse({schemaVersion:1,id,name,profileId:'arduino-uno',mode:'blocks',source:'',workspace,revision:0,wiring:{...arduinoUnoRobotWiring}});
 return {...project,source:generateForProject(arduinoUnoBlocksProgram,project)};
}
