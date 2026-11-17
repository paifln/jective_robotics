import type {Project} from '../contracts';
/** The assembled Uno robot: DRV8833 on D4/5/6/9/10, HC-05 on D2/3. */
export const arduinoUnoRobotWiring = {bluetoothRx:2,bluetoothTx:3,motorSleep:4,leftForward:5,leftReverse:6,rightForward:9,rightReverse:10,led:13};
export function hasArduinoUnoRobotWiring(project:Pick<Project,'profileId'|'wiring'>){
 return project.profileId==='arduino-uno'&&Object.entries(arduinoUnoRobotWiring).filter(([role])=>role!=='led').every(([role,pin])=>project.wiring?.[role]===pin);
}
export const arduinoUnoMotorDriver = `#include <SoftwareSerial.h>
SoftwareSerial j_bluetooth(2, 3);
bool j_motor_stopped = false;
void j_motor_stop() {
  analogWrite(5, 0); analogWrite(6, 0);
  analogWrite(9, 0); analogWrite(10, 0);
}
bool j_motor_poll() {
  while (Serial.available()) if (Serial.read() == 'S') j_motor_stopped = true;
  while (j_bluetooth.available()) if (j_bluetooth.read() == 'S') j_motor_stopped = true;
  if (j_motor_stopped) j_motor_stop();
  return !j_motor_stopped;
}
bool j_motor_wait(unsigned long duration) {
  const unsigned long started = millis();
  do {
    if (!j_motor_poll()) return false;
    delay(1);
  } while (millis() - started < duration);
  return true;
}
void j_motor_setup() {
  pinMode(4, OUTPUT);
  digitalWrite(4, LOW);
  pinMode(5, OUTPUT); pinMode(6, OUTPUT);
  pinMode(9, OUTPUT); pinMode(10, OUTPUT);
  j_motor_stop();
  digitalWrite(4, HIGH);
  j_bluetooth.begin(9600);
}
bool j_motor_drive(double left, double right) {
  if (!j_motor_poll()) return false;
  const int a = static_cast<int>(floor(fabs(left) * 255.0 / 100.0 + 0.5));
  const int b = static_cast<int>(floor(fabs(right) * 255.0 / 100.0 + 0.5));
  j_motor_stop();
  analogWrite(5, left > 0 ? a : 0); analogWrite(6, left < 0 ? a : 0);
  analogWrite(9, right > 0 ? b : 0); analogWrite(10, right < 0 ? b : 0);
  return true;
}
`;
