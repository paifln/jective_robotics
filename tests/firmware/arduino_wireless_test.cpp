#include <Arduino.h>
#include <stdlib.h>
#include "../../firmware/arduino-uno-wireless/arduino-uno-wireless.ino"

void resetRuntime() {
  clearProgram(); testTime = 0; Serial.reset(); BT.reset();
  usbLine = {}; bluetoothLine = {}; memcpy(transaction, "00000000", 9);
  stepCount = received = pc = 0; loopStart = -1; transferCrc = 0xffff;
  memset(pwmValues, 0, sizeof(pwmValues)); memset(digitalValues, 0, sizeof(digitalValues)); setup();
}
void pump() { unsigned budget = 1000; do { loop(); assert(--budget); } while (Serial.available() || BT.available()); }
void send(Stream& stream, const char* text) { stream.add(text); pump(); }
void stopped() { assert(pwmValues[5] == 0 && pwmValues[6] == 0 && pwmValues[9] == 0 && pwmValues[10] == 0); }
void outputContains(Stream& stream, const char* text) { if (!strstr(stream.output, text)) { fprintf(stderr, "Expected %s in %s\n", text, stream.output); abort(); } }

// Independent reference serializer, checked against the shared TypeScript golden vector.
uint16_t referenceCrc(const Step* program, int count, int start) {
  uint8_t data[4 + 96 * 9]; size_t size = 0;
  data[size++] = static_cast<uint8_t>(count); data[size++] = 0;
  data[size++] = static_cast<uint8_t>(start); data[size++] = static_cast<uint8_t>(start >> 8);
  for (int i = 0; i < count; ++i) {
    data[size++] = program[i].op;
    for (int n = 0; n < 4; ++n) data[size++] = static_cast<uint8_t>(static_cast<uint32_t>(program[i].a) >> (n * 8));
    for (int n = 0; n < 4; ++n) data[size++] = static_cast<uint8_t>(static_cast<uint32_t>(program[i].b) >> (n * 8));
  }
  uint32_t crc = 65535;
  for (size_t i = 0; i < size; ++i) {
    crc ^= static_cast<uint32_t>(data[i]) << 8;
    for (int bit = 0; bit < 8; ++bit) crc = ((crc << 1) ^ ((crc & 32768) ? 4129 : 0)) & 65535;
  }
  return static_cast<uint16_t>(crc);
}
void upload(Stream& stream, const Step* program, int count, int start = -1) {
  char frame[96]; snprintf(frame, sizeof(frame), "!jr1 begin a1b2c3d4 %d %d\n", count, start); send(stream, frame);
  for (int i = 0; i < count; ++i) { snprintf(frame, sizeof(frame), "!jr1 step a1b2c3d4 %d %c %ld %ld\n", i, program[i].op, static_cast<long>(program[i].a), static_cast<long>(program[i].b)); send(stream, frame); }
  snprintf(frame, sizeof(frame), "!jr1 commit a1b2c3d4 %u\n", referenceCrc(program, count, start)); send(stream, frame);
  assert(ready && !running && !uploading); stopped(); outputContains(stream, "!jr1 ready a1b2c3d4\n");
}

int bridge() {
  resetRuntime(); char input[32768]; puts("bridge-ready"); fflush(stdout);
  while (fgets(input, sizeof(input), stdin)) {
    if (strncmp(input, "rx ", 3) == 0) {
      size_t size = strcspn(input + 3, "\r\n"); assert(size % 2 == 0);
      for (size_t i = 0; i < size; i += 2) { char hex[] = {input[i + 3], input[i + 4], 0}; char byte = static_cast<char>(strtoul(hex, NULL, 16)); BT.add(&byte, 1); }
      pump();
    } else if (strncmp(input, "tick ", 5) == 0) { testTime += static_cast<uint32_t>(strtoul(input + 5, NULL, 10)); pump(); }
    else if (strncmp(input, "state", 5) == 0) printf("state %d %d %d %d %d %d %d\n", running, ready, uploading, pwmValues[5], pwmValues[6], pwmValues[9], pwmValues[10]);
    else return 2;
    if (BT.outputSize) { fputs("tx ", stdout); for (size_t i = 0; i < BT.outputSize; ++i) printf("%02x", static_cast<unsigned char>(BT.output[i])); putchar('\n'); BT.clearOutput(); }
    // The bridge may handle many host requests; only unread fake UART bytes need to survive.
    if (!BT.available()) BT.readAt = BT.inputSize = 0;
    puts("bridge-idle");
    fflush(stdout);
  }
  return 0;
}

int main(int argc, char** argv) {
  if (argc == 2 && strcmp(argv[1], "--bridge") == 0) return bridge();
  resetRuntime(); stopped(); send(BT, "?jr1 1234abcd\n");
  assert(strcmp(BT.output, "!jr1 hello 1234abcd 1\n") == 0); stopped(); assert(Serial.outputSize == 0);

  const Step golden[] = {{'m', -255, 255}, {'w', 60000, 0}, {'l', 1, 0}, {'s', 0, 0}};
  assert(referenceCrc(golden, 4, 1) == 63613);
  upload(BT, golden, 4, 1); send(BT, "!jr1 run a1b2c3d4\n");
  assert(running && waiting && pwmValues[6] == 255 && pwmValues[9] == 255);
  testTime = 1499; loop(); assert(running); send(BT, "!jr1 ping a1b2c3d4\n");
  testTime += 1499; loop(); assert(running); testTime += 1; loop(); assert(!running && !ready); stopped(); outputContains(BT, "heartbeat");
  send(BT, "!jr1 ping a1b2c3d4\n!jr1 run a1b2c3d4\n"); stopped(); assert(!running);

  resetRuntime(); const Step finite[] = {{'m', 89, 89}, {'w', 100, 0}, {'s', 0, 0}, {'l', 1, 0}};
  upload(BT, finite, 4); send(BT, "!jr1 run a1b2c3d4\n"); assert(pwmValues[5] == 89 && pwmValues[9] == 89);
  testTime = 99; loop(); assert(running); testTime = 100; loop(); stopped(); assert(!running && ready && digitalValues[13] == 1); outputContains(BT, "!jr1 done a1b2c3d4\n");

  resetRuntime(); const Step repeating[] = {{'l', 1, 0}, {'m', 150, -150}, {'w', 100, 0}, {'s', 0, 0}, {'w', 100, 0}};
  upload(BT, repeating, 5, 1); send(BT, "!jr1 run a1b2c3d4\n"); digitalValues[13] = 0;
  testTime = 100; loop(); stopped(); testTime = 200; loop(); assert(running && pwmValues[5] == 150 && pwmValues[10] == 150 && digitalValues[13] == 0);
  send(BT, "S"); stopped(); assert(!running && !ready); outputContains(BT, "!jr1 stopped a1b2c3d4\n");

  resetRuntime(); send(BT, "!jr1 begin 1234abcd 1 -1\n!jr1 step 1234abcd 0 m 255 255\n!jr1 commit 1234abcd 0\n!jr1 run 1234abcd\n");
  stopped(); assert(!ready && !running); outputContains(BT, "checksum");
  send(BT, "!jr1 begin 1234abcd 2 -1\n!jr1 step 1234abcd 1 m 255 255\n"); stopped(); assert(!uploading); outputContains(BT, "step");
  send(BT, "!jr1 begin 1234abcd 97 -1\n"); assert(!uploading); outputContains(BT, "header");
  send(BT, "!jr1 begin 1234abcd 1 1\n"); assert(!uploading);
  send(BT, "!jr1 begin 1234abcd 1 -1\n!jr1 step 1234abcd 0 m 256 0\n"); assert(!uploading); stopped();

  resetRuntime(); send(BT, "!jr1 begin 1234abcd 1 -1\n!jr1 step 1234abcd 0 m 255"); stopped(); assert(uploading);
  send(BT, "S 255\n!jr1 commit 1234abcd 0\n"); stopped(); assert(!uploading && !ready);
  send(BT, "?jr1 1234abcd\n"); outputContains(BT, "!jr1 hello 1234abcd 1\n");
  send(BT, "!jr1 begin 1234abcd 1 -1\n"); testTime = 3000; loop(); assert(!uploading); outputContains(BT, "transfer_timeout");

  resetRuntime(); upload(BT, golden, 4, 1); send(BT, "!jr1 run a1b2c3d4\n");
  send(Serial, "!jr1 begin deadbeef 1 -1\n!jr1 ping a1b2c3d4\n!jr1 run a1b2c3d4\n"); assert(running && owner == &BT); outputContains(Serial, "busy");
  testTime = 1500; loop(); stopped(); assert(!running);
  upload(BT, golden, 4, 1); send(BT, "!jr1 run a1b2c3d4\n"); send(Serial, "S"); stopped(); assert(!running);

  resetRuntime(); send(BT, "!jr1 begin 1234abcd 1 -1\n"); char oversized[130]; memset(oversized, 'a', sizeof(oversized)); oversized[0] = '!'; oversized[128] = '\n'; oversized[129] = 0; send(BT, oversized);
  assert(!uploading); outputContains(BT, "line_length");
  send(BT, "!jr1 begin 1234abcd 1 -1\n"); const char nul[] = "!jr1 step 1234abcd 0 m 1 1\0junk\n"; BT.add(nul, sizeof(nul) - 1); pump(); assert(!uploading); outputContains(BT, "character");

  resetRuntime(); send(BT, "F"); assert(manual && pwmValues[5] == 200 && pwmValues[9] == 200);
  send(Serial, "!jr1 begin deadbeef 1 -1\n"); assert(manual && !uploading && manualOwner == &BT); outputContains(Serial, "busy");
  testTime = 350; loop(); stopped(); assert(!manual); send(BT, "!wrongFBLR\n"); stopped();
  send(BT, "F"); send(BT, "S"); stopped();

  resetRuntime(); const Step tightLoop[] = {{'l', 1, 0}}; upload(BT, tightLoop, 1, 0); send(BT, "!jr1 run a1b2c3d4\n"); assert(running); send(BT, "S"); stopped(); assert(!running);
  resetRuntime(); Step maximum[96]; for (int i = 0; i < 96; ++i) maximum[i] = {'l', i % 2, 0}; upload(BT, maximum, 96); send(BT, "!jr1 run a1b2c3d4\n"); assert(running && pc == 8); for (int i = 0; i < 20; ++i) loop(); assert(!running && digitalValues[13] == 1); stopped();
  resetRuntime(); testTime = 0xfffffff0UL; upload(BT, finite, 4); send(BT, "!jr1 run a1b2c3d4\n"); testTime += 100; loop(); assert(!running); stopped();
  puts("PASS: real firmware handshake, CRC, VM, wait/loop, STOP, heartbeat, partial/malformed frames, USB ownership, manual watchdog and millis rollover");
}
