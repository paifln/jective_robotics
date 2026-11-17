#pragma once
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <stdio.h>
#include <assert.h>

struct __FlashStringHelper {};
#define F(value) reinterpret_cast<const __FlashStringHelper*>(value)
const int OUTPUT = 1, HIGH = 1, LOW = 0;
inline uint32_t testTime = 0;
inline int pwmValues[32] = {}, digitalValues[32] = {};
inline uint32_t millis() { return testTime; }
inline void pinMode(int, int) {}
inline void analogWrite(int pin, int value) { assert(pin >= 0 && pin < 32); assert(value >= 0 && value <= 255); pwmValues[pin] = value; }
inline void digitalWrite(int pin, int value) { digitalValues[pin] = value; }

class Stream {
 public:
  char input[32768] = {}, output[32768] = {};
  size_t readAt = 0, inputSize = 0, outputSize = 0;
  void begin(long) {}
  int available() { return static_cast<int>(inputSize - readAt); }
  int read() { return available() ? static_cast<unsigned char>(input[readAt++]) : -1; }
  void add(const char* data, size_t size) { assert(inputSize + size < sizeof(input)); memcpy(input + inputSize, data, size); inputSize += size; }
  void add(const char* text) { add(text, strlen(text)); }
  void print(const char* text) { size_t length = strlen(text); assert(outputSize + length < sizeof(output)); memcpy(output + outputSize, text, length + 1); outputSize += length; }
  void print(const __FlashStringHelper* text) { print(reinterpret_cast<const char*>(text)); }
  void print(char value) { char text[] = {value, 0}; print(text); }
  void print(int32_t value) { char text[32]; snprintf(text, sizeof(text), "%ld", static_cast<long>(value)); print(text); }
  void println() { print('\n'); }
  void println(const char* value) { print(value); println(); }
  void println(const __FlashStringHelper* value) { print(value); println(); }
  void println(int32_t value) { print(value); println(); }
  void reset() { readAt = inputSize = outputSize = 0; input[0] = output[0] = 0; }
  void clearOutput() { outputSize = 0; output[0] = 0; }
};
inline Stream Serial;
