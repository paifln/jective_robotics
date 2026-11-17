#include <SoftwareSerial.h>

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
