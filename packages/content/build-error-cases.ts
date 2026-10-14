export type BuildErrorCase={id:'symbol'|'type'|'library'|'board';starter:{source:string;profileId:string};corrected:{source:string;profileId:string};diagnosticPattern:string};
const profileId='esp32-devkit-reference';
const boardSource='#if !defined(CONFIG_IDF_TARGET_ESP32)\n#error "This lesson requires the generic ESP32 profile, not ESP32-C3."\n#endif\nvoid setup() {}\nvoid loop() {}\n';
/** Fixed compiler exercises. None initialize motors, upload code or identify physical hardware. */
export const buildErrorCases:BuildErrorCase[]=[
 {id:'symbol',starter:{profileId,source:'void setup() {\n  Serial.begin(115200);\n  reportStatus();\n}\nvoid loop() {}\n'},corrected:{profileId,source:'void reportStatus() { Serial.println("READY"); }\nvoid setup() {\n  Serial.begin(115200);\n  reportStatus();\n}\nvoid loop() {}\n'},diagnosticPattern:'reportStatus'},
 {id:'type',starter:{profileId,source:'struct Reading { float metres; };\nvoid setup() {\n  Reading reading{1.0f};\n  int count = reading;\n  Serial.println(count);\n}\nvoid loop() {}\n'},corrected:{profileId,source:'struct Reading { float metres; };\nvoid setup() {\n  Reading reading{1.0f};\n  float metres = reading.metres;\n  Serial.println(metres);\n}\nvoid loop() {}\n'},diagnosticPattern:'cannot convert'},
 {id:'library',starter:{profileId,source:'#include <Wrie.h>\nvoid setup() {}\nvoid loop() {}\n'},corrected:{profileId,source:'#include <Wire.h>\nvoid setup() {}\nvoid loop() {}\n'},diagnosticPattern:'Wrie.h'},
 {id:'board',starter:{profileId:'esp32c3-reference',source:boardSource},corrected:{profileId,source:boardSource},diagnosticPattern:'generic ESP32 profile'}
];
