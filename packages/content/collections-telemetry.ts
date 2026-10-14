import {z} from 'zod';
export const sampleCapacity=8;
export const SampleInputSchema=z.string().max(2048).refine(text=>text.split(',').length<=64,'SAMPLE_LIMIT');
export type Sample={value:number|null;status:'valid'|'missing'|'malformed'};
export function parseSample(token:string):Sample{
 if(token.length>16)return {value:null,status:'malformed'};
 const trimmed=token.replace(/^[ \t]+|[ \t]+$/g,'');
 if(trimmed===''||trimmed==='?')return {value:null,status:'missing'};
 if(!/^[0-9]{1,4}$/.test(trimmed)||Number(trimmed)>4095)return {value:null,status:'malformed'};
 return {value:Number(trimmed),status:'valid'};
}
export function collectionMessage(value:unknown){const text=SampleInputSchema.parse(value),tokens=text===''?[]:text.split(',');return {v:1 as const,origin:'lesson-input' as const,unit:'adc-count' as const,count:Math.min(tokens.length,sampleCapacity),dropped:Math.max(0,tokens.length-sampleCapacity),samples:tokens.slice(-sampleCapacity).map(parseSample)};}
/** Authoritative C++ lesson core, used verbatim by native checks and both sketches. */
export const boundedSamplesCore=`#include <stdint.h>
#include <stddef.h>
#include <stdio.h>
#include <stdarg.h>
namespace lesson {
enum class Status : uint8_t { Valid, Missing, Malformed };
struct Sample { uint16_t value=0; Status status=Status::Missing; };
inline Sample parseSample(const char* text, size_t length) {
  if(!text||length>16)return {0,Status::Malformed};
  while(length&&(text[0]==' '||text[0]=='\\t')){++text;--length;}
  while(length&&(text[length-1]==' '||text[length-1]=='\\t'))--length;
  if(!length||(length==1&&text[0]=='?'))return {0,Status::Missing};
  if(length>4)return {0,Status::Malformed};
  uint16_t value=0;
  for(size_t i=0;i<length;++i){if(text[i]<'0'||text[i]>'9')return {0,Status::Malformed};value=uint16_t(value*10+text[i]-'0');}
  if(value>4095)return {0,Status::Malformed};
  return {value,Status::Valid};
}
class SampleWindow {
 public:
  static constexpr size_t capacity=8;
  void clear(){count_=next_=0;dropped_=0;}
  void push(Sample sample){
    if(sample.status!=Status::Valid&&sample.status!=Status::Missing&&sample.status!=Status::Malformed)sample={0,Status::Malformed};
    if(sample.status==Status::Valid&&sample.value>4095)sample={0,Status::Malformed};
    if(sample.status!=Status::Valid)sample.value=0;
    samples_[next_]=sample;next_=(next_+1)%capacity;
    if(count_<capacity)++count_;else if(dropped_!=UINT32_MAX)++dropped_;
  }
  size_t count()const{return count_;}
  uint32_t dropped()const{return dropped_;}
  bool at(size_t index,Sample& result)const{
    if(index>=count_)return false;
    result=samples_[(count_==capacity?next_+index:index)%capacity];return true;
  }
  bool message(char* output,size_t size)const{
    if(!output||!size)return false;
    size_t used=0;output[0]=0;
    auto append=[&](const char* format,...){va_list args;va_start(args,format);const int n=vsnprintf(output+used,size-used,format,args);va_end(args);if(n<0||size_t(n)>=size-used)return false;used+=size_t(n);return true;};
    bool ok=append("{\\\"v\\\":1,\\\"origin\\\":\\\"lesson-input\\\",\\\"unit\\\":\\\"adc-count\\\",\\\"count\\\":%u,\\\"dropped\\\":%lu,\\\"samples\\\":[",unsigned(count_),static_cast<unsigned long>(dropped_));
    for(size_t i=0;ok&&i<count_;++i){Sample s;const bool found=at(i,s);if(!found){ok=false;break;}if(i)ok=append(",");if(!ok)break;
      if(s.status==Status::Valid)ok=append("{\\\"value\\\":%u,\\\"status\\\":\\\"valid\\\"}",unsigned(s.value));
      else ok=append("{\\\"value\\\":null,\\\"status\\\":\\\"%s\\\"}",s.status==Status::Missing?"missing":"malformed");
    }
    if(ok)ok=append("]}");if(!ok)output[0]=0;return ok;
  }
 private:
  Sample samples_[capacity];size_t count_=0,next_=0;uint32_t dropped_=0;
};
static_assert(sizeof(SampleWindow)<=128,"Sample collection must remain bounded");
}
`;
const correctedReader=`// STUDENT TASK: a valid zero is a measurement, not a missing sample.
lesson::Sample readSample(const char* text, size_t length) {
  return lesson::parseSample(text,length);
}
`;
const starterReader=correctedReader.replace('  return lesson::parseSample(text,length);','  auto sample=lesson::parseSample(text,length);\n  if(sample.value==0)sample={0,lesson::Status::Missing}; // TODO: preserve valid zero and malformed status.\n  return sample;');
const sketch=(reader:string)=>`#include <Arduino.h>
${boundedSamplesCore}
${reader}
// Input is manually supplied comma-separated ADC counts, not automatic sensor data.
lesson::SampleWindow window;
char token[16];size_t tokenLength=0;bool overflow=false,lineHasInput=false;
void finishToken(){window.push(overflow?lesson::Sample{0,lesson::Status::Malformed}:readSample(token,tokenLength));tokenLength=0;overflow=false;}
void setup(){Serial.begin(115200);Serial.println("Enter manual samples, comma-separated, followed by newline. ? means missing.");}
void loop(){
  for(int budget=32;budget>0&&Serial.available();--budget){
    const int byte=Serial.read();if(byte<0)break;const char c=char(byte);
    if(c=='\\r')continue;
    if(c=='\\n'){
      if(lineHasInput){finishToken();char message[512];if(window.message(message,sizeof(message)))Serial.println(message);else Serial.println("Message buffer too small");}
      window.clear();lineHasInput=false;
    }else if(c==','){finishToken();lineHasInput=true;}
    else{lineHasInput=true;if(tokenLength<sizeof(token))token[tokenLength++]=c;else overflow=true;}
  }
}
`;
export const collectionsArtifact={starter:sketch(starterReader),reference:sketch(correctedReader)};
