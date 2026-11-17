#include <Arduino.h>
#include <SoftwareSerial.h>
#include <stdint.h>
#include <string.h>

SoftwareSerial BT(2, 3);
const uint8_t MAX_STEPS = 96;
const uint8_t LINE_CAPACITY = 96;
const uint32_t TRANSFER_TIMEOUT_MS = 3000;
const uint32_t HEARTBEAT_TIMEOUT_MS = 1500;

struct Step { char op; int32_t a; int32_t b; };
struct InputLine { char text[LINE_CAPACITY]; uint8_t length; bool dropping; uint32_t lastByte; };
Step steps[MAX_STEPS];
InputLine usbLine = {}, bluetoothLine = {};
Stream* owner = NULL;
Stream* manualOwner = NULL;
char transaction[9] = "00000000";
uint8_t stepCount = 0, received = 0, pc = 0;
int16_t loopStart = -1;
uint16_t transferCrc = 0xffff;
bool uploading = false, ready = false, running = false, waiting = false, manual = false;
uint32_t lastTransfer = 0, lastHeartbeat = 0, waitStarted = 0, waitDuration = 0, lastManual = 0;

void stopMotors() {
  analogWrite(5, 0); analogWrite(6, 0);
  analogWrite(9, 0); analogWrite(10, 0);
}

void driveMotors(int left, int right) {
  stopMotors();
  analogWrite(5, left > 0 ? left : 0); analogWrite(6, left < 0 ? -left : 0);
  analogWrite(9, right > 0 ? right : 0); analogWrite(10, right < 0 ? -right : 0);
}

void clearProgram() {
  stopMotors();
  uploading = ready = running = waiting = manual = false;
  owner = manualOwner = NULL;
}

void reply(Stream& output, const __FlashStringHelper* kind, const char* tx) {
  output.print(F("!jr1 ")); output.print(kind); output.print(' '); output.print(tx);
}

void fault(Stream& output, const char* tx, const __FlashStringHelper* code, bool revoke) {
  if (revoke) clearProgram();
  reply(output, F("error"), tx); output.print(' '); output.println(code);
}

bool validToken(const char* token) {
  if (strlen(token) != 8) return false;
  for (uint8_t i = 0; i < 8; ++i) if (!((token[i] >= '0' && token[i] <= '9') || (token[i] >= 'a' && token[i] <= 'f'))) return false;
  return true;
}

bool number(const char* text, int32_t minimum, int32_t maximum, int32_t& result) {
  bool negative = *text == '-'; if (negative) ++text;
  if (!*text) return false;
  uint32_t value = 0;
  while (*text) {
    if (*text < '0' || *text > '9') return false;
    uint8_t digit = static_cast<uint8_t>(*text++ - '0');
    if (value > (2147483647UL - digit) / 10) return false;
    value = value * 10 + digit;
  }
  result = negative ? -static_cast<int32_t>(value) : static_cast<int32_t>(value);
  return result >= minimum && result <= maximum;
}

uint16_t crcByte(uint16_t crc, uint8_t value) {
  crc ^= static_cast<uint16_t>(value) << 8;
  for (uint8_t bit = 0; bit < 8; ++bit) crc = (crc & 0x8000) ? static_cast<uint16_t>((crc << 1) ^ 0x1021) : static_cast<uint16_t>(crc << 1);
  return crc;
}

uint16_t crc16(uint16_t crc, uint16_t value) {
  return crcByte(crcByte(crc, value & 255), value >> 8);
}

uint16_t crc32(uint16_t crc, int32_t value) {
  uint32_t bits = static_cast<uint32_t>(value);
  for (uint8_t i = 0; i < 4; ++i) { crc = crcByte(crc, bits & 255); bits >>= 8; }
  return crc;
}

bool validStep(char op, int32_t a, int32_t b) {
  if (op == 'm') return a >= -255 && a <= 255 && b >= -255 && b <= 255;
  if (op == 'w') return a >= 0 && a <= 60000 && b == 0;
  if (op == 's') return a == 0 && b == 0;
  return op == 'l' && (a == 0 || a == 1) && b == 0;
}

void handleLine(Stream& input, char* line) {
  char* tokens[9]; uint8_t count = 0;
  char* cursor = line;
  while (*cursor) {
    while (*cursor == ' ') ++cursor;
    if (!*cursor) break;
    if (count == 9) { fault(input, transaction, F("frame"), owner == &input); return; }
    tokens[count++] = cursor;
    while (*cursor && *cursor != ' ') ++cursor;
    if (*cursor) *cursor++ = 0;
  }
  if (count == 2 && strcmp(tokens[0], "?jr1") == 0 && validToken(tokens[1])) {
    reply(input, F("hello"), tokens[1]); input.println(F(" 1")); return;
  }
  if (count < 3 || strcmp(tokens[0], "!jr1") != 0 || !validToken(tokens[2])) {
    fault(input, transaction, F("frame"), owner == &input); return;
  }
  const char* command = tokens[1]; const char* tx = tokens[2];
  if (strcmp(command, "begin") == 0) {
    if ((owner && owner != &input) || (manualOwner && manualOwner != &input)) { fault(input, tx, F("busy"), false); return; }
    int32_t length = 0, loop = -1;
    if (count != 5 || !number(tokens[3], 1, MAX_STEPS, length) || !number(tokens[4], -1, length - 1, loop)) { fault(input, tx, F("header"), true); return; }
    clearProgram(); owner = &input; memcpy(transaction, tx, 9);
    stepCount = static_cast<uint8_t>(length); loopStart = static_cast<int16_t>(loop); received = 0;
    transferCrc = crc16(crc16(0xffff, stepCount), static_cast<uint16_t>(loopStart));
    uploading = true; lastTransfer = millis();
    reply(input, F("ack"), transaction); input.println(F(" begin")); return;
  }
  if (owner != &input || strcmp(tx, transaction) != 0) { fault(input, tx, F("transaction"), false); return; }
  if (strcmp(command, "step") == 0) {
    int32_t index = -1, a = 0, b = 0;
    if (!uploading || count != 7 || !number(tokens[3], 0, MAX_STEPS - 1, index) || index != received || received >= stepCount || strlen(tokens[4]) != 1 || !number(tokens[5], -255, 60000, a) || !number(tokens[6], -255, 255, b) || !validStep(tokens[4][0], a, b)) { fault(input, tx, F("step"), true); return; }
    Step& step = steps[received++]; step.op = tokens[4][0]; step.a = a; step.b = b;
    transferCrc = crc32(crc32(crcByte(transferCrc, static_cast<uint8_t>(step.op)), a), b);
    lastTransfer = millis(); reply(input, F("ack"), transaction); input.print(' '); input.println(index); return;
  }
  if (strcmp(command, "commit") == 0) {
    int32_t crc = 0;
    if (!uploading || count != 4 || received != stepCount || !number(tokens[3], 0, 65535, crc) || transferCrc != crc) { fault(input, tx, F("checksum"), true); return; }
    uploading = false; ready = true;
    reply(input, F("ready"), transaction); input.println(); return;
  }
  if (strcmp(command, "run") == 0) {
    if (count != 3 || !ready || uploading || running) { fault(input, tx, F("not_ready"), true); return; }
    stopMotors(); running = true; waiting = false; pc = 0; lastHeartbeat = millis();
    reply(input, F("running"), transaction); input.println(); return;
  }
  if (strcmp(command, "ping") == 0 && count == 3) {
    if (running) lastHeartbeat = millis();
    return;
  }
  fault(input, tx, F("command"), true);
}

void emergencyStop(Stream& input) {
  clearProgram();
  reply(input, F("stopped"), transaction); input.println();
}

void manualCommand(Stream& input, char command) {
  if (owner || (manualOwner && manualOwner != &input)) return;
  int left = 200, right = 200;
  if (command == 'B') left = right = -200;
  if (command == 'L') left = -200;
  if (command == 'R') right = -200;
  driveMotors(left, right); manualOwner = &input; manual = true; lastManual = millis();
}

void readInput(Stream& input, InputLine& line) {
  for (uint8_t budget = 0; budget < 32 && input.available(); ++budget) {
    char value = static_cast<char>(input.read());
    line.lastByte = millis();
    if (value == 'S') {
      bool partial = line.length != 0 || line.dropping;
      line.length = 0; line.dropping = partial;
      emergencyStop(input); continue;
    }
    if (value == '\r') continue;
    if (value == '\n') {
      if (!line.dropping && line.length) { line.text[line.length] = 0; handleLine(input, line.text); }
      line.length = 0; line.dropping = false; continue;
    }
    if (static_cast<uint8_t>(value) < 32 || static_cast<uint8_t>(value) > 126) {
      line.length = 0; line.dropping = true;
      fault(input, transaction, F("character"), owner == &input); continue;
    }
    if (line.dropping) {
      if (value != '!' && value != '?') continue;
      line.dropping = false; line.length = 0;
    }
    if (line.length == 0 && (value == 'F' || value == 'B' || value == 'L' || value == 'R')) { manualCommand(input, value); continue; }
    if (line.length == 0 && value != '!' && value != '?') { line.dropping = true; continue; }
    if (line.length >= LINE_CAPACITY - 1) {
      line.length = 0; line.dropping = true;
      fault(input, transaction, F("line_length"), owner == &input); continue;
    }
    line.text[line.length++] = value;
  }
}

void executeProgram() {
  if (!running) return;
  uint32_t now = millis();
  if (now - lastHeartbeat >= HEARTBEAT_TIMEOUT_MS) {
    Stream* output = owner;
    clearProgram(); if (output) { reply(*output, F("error"), transaction); output->println(F(" heartbeat")); }
    return;
  }
  if (waiting) {
    if (now - waitStarted < waitDuration) return;
    waiting = false;
  }
  for (uint8_t budget = 0; budget < 8; ++budget) {
    if (pc >= stepCount) {
      if (loopStart >= 0) pc = static_cast<uint8_t>(loopStart);
      else { running = false; stopMotors(); reply(*owner, F("done"), transaction); owner->println(); return; }
    }
    const Step& step = steps[pc++];
    if (step.op == 'm') driveMotors(static_cast<int>(step.a), static_cast<int>(step.b));
    else if (step.op == 's') stopMotors();
    else if (step.op == 'l') digitalWrite(13, step.a ? HIGH : LOW);
    else if (step.op == 'w' && step.a > 0) { waiting = true; waitStarted = now; waitDuration = static_cast<uint32_t>(step.a); return; }
  }
}

void setup() {
  pinMode(4, OUTPUT); digitalWrite(4, LOW);
  pinMode(5, OUTPUT); pinMode(6, OUTPUT); pinMode(9, OUTPUT); pinMode(10, OUTPUT);
  pinMode(13, OUTPUT); digitalWrite(13, LOW); stopMotors(); digitalWrite(4, HIGH);
  Serial.begin(9600); BT.begin(9600);
}

void loop() {
  readInput(Serial, usbLine); readInput(BT, bluetoothLine);
  uint32_t now = millis();
  if (uploading && now - lastTransfer >= TRANSFER_TIMEOUT_MS) { Stream* output = owner; clearProgram(); if (output) fault(*output, transaction, F("transfer_timeout"), false); }
  if (manual && now - lastManual >= 350) { stopMotors(); manual = false; manualOwner = NULL; }
  if ((usbLine.length || usbLine.dropping) && now - usbLine.lastByte >= TRANSFER_TIMEOUT_MS) { usbLine.length = 0; usbLine.dropping = false; }
  if ((bluetoothLine.length || bluetoothLine.dropping) && now - bluetoothLine.lastByte >= TRANSFER_TIMEOUT_MS) { bluetoothLine.length = 0; bluetoothLine.dropping = false; }
  executeProgram();
}
