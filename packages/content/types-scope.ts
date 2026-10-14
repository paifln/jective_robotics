import {z} from 'zod';
import {copy as l,type LearningActivity} from './learning-activities';
export const DivisionInput=z.object({numerator:z.number().int().min(-10000).max(10000),denominator:z.number().int().min(-10000).max(10000).refine(n=>n!==0,'A divisor cannot be zero')}).strict();
/** Bounded teaching model, not an arbitrary C++ interpreter or board execution. */
export function divisionObservation(input:unknown){const {numerator,denominator}=DivisionInput.parse(input);return {numerator,denominator,integerResult:Math.trunc(numerator/denominator)||0,floatingResult:numerator/denominator,lateConversion:Math.trunc(numerator/denominator)||0,positive:numerator>0,origin:'bounded-teaching-model' as const};}
export const divisionBoundaries=[{numerator:0,denominator:2},{numerator:1,denominator:2},{numerator:3,denominator:2},{numerator:4,denominator:2},{numerator:-3,denominator:2},{numerator:3,denominator:-2}] as const;
export const typesScopeCore=`#include <stdint.h>
struct DivisionResult { int32_t integerResult; double floatingResult; double lateConversion; bool positive; };
DivisionResult observeDivision(int32_t numerator, int32_t denominator) {
  // Caller must reject a zero divisor; lesson inputs are bounded to +/-10000.
  return {numerator / denominator, static_cast<double>(numerator) / denominator,
          static_cast<double>(numerator / denominator), numerator > 0};
}
`;
const sketch=(corrected:boolean)=>`#include <Arduino.h>
${typesScopeCore}
const int32_t samples[] = {0, 1, 3, 4, -3};
uint32_t completedPasses = 0; // File scope; initialized once after reset.
void setup() {
  Serial.begin(115200);
  for (int32_t numerator : samples) {
    const int32_t denominator = 2;
    const DivisionResult result = observeDivision(numerator, denominator);
    ${corrected?'const double average = result.floatingResult;':'const int32_t average = result.integerResult; // Find the lost fraction.'}
    Serial.print(numerator); Serial.print(" / 2 = "); Serial.println(average);
  }
}
void loop() {
  int32_t localPasses = 0; // Recreated every call; never counts earlier calls.
  ++localPasses;
  ++completedPasses;
  Serial.print("local="); Serial.print(localPasses);
  Serial.print(" total="); Serial.println(completedPasses);
  delay(1000);
}
`;
export const typesScopeArtifact={starter:sketch(false),reference:sketch(true)};
export const invalidScopeSource=typesScopeArtifact.reference.replace('Serial.begin(115200);','Serial.begin(115200);\n  Serial.println(localPasses); // Not declared in setup scope.');
export function scopeTrace(calls:number){if(!Number.isInteger(calls)||calls<0||calls>20)throw new Error('L38_CALL_COUNT_INVALID');return Array.from({length:calls},(_,index)=>({call:index+1,localPasses:1,completedPasses:index+1}));}
export const typesScopeExercise:Extract<LearningActivity,{kind:'match'}>={id:'L38',kind:'match',prompt:l('Predict each expression before opening the sample answer.','Предскажи результат каждого выражения до открытия ответа.','Жауапты ашпай тұрып әр өрнекті болжа.'),hint:l('Look at the operands before division, and at the braces around a declaration.','Посмотри на типы до деления и скобки вокруг объявления.','Бөлуге дейінгі түрге және жариялау жақшасына қара.'),explanation:l('Integer division discards fractions toward zero. Converting afterwards cannot recover them. A name declared in loop is not visible in setup.','Целое деление отбрасывает дробь к нулю. Позднее преобразование её не возвращает. Имя внутри loop недоступно в setup.','Бүтін бөлу бөлшекті нөлге қарай алып тастайды. Кейін түрлендіру оны қайтармайды. loop ішіндегі атау setup ішінде жоқ.'),items:[{id:'integer',label:l('3 / 2','3 / 2','3 / 2')},{id:'late',label:l('static_cast<double>(3 / 2)','static_cast<double>(3 / 2)','static_cast<double>(3 / 2)')},{id:'early',label:l('static_cast<double>(3) / 2','static_cast<double>(3) / 2','static_cast<double>(3) / 2')},{id:'negative',label:l('-3 / 2','-3 / 2','-3 / 2')},{id:'negative-float',label:l('static_cast<double>(-3) / 2','static_cast<double>(-3) / 2','static_cast<double>(-3) / 2')},{id:'scope',label:l('Use loop-local localPasses inside setup','Использовать локальную localPasses из loop в setup','loop ішіндегі жергілікті localPasses атауын setup ішінде қолдану')}],categories:['0','1','1.5','-1','-1.5'].map(id=>({id,label:l(id,id,id)})).concat([{id:'unavailable',label:l('Name unavailable; compile error','Имя недоступно: ошибка компиляции','Атау жоқ: компиляция қатесі')}]),correct:{integer:'1',late:'1',early:'1.5',negative:'-1','negative-float':'-1.5',scope:'unavailable'}};
