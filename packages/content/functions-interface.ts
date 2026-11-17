import {runtimeLibrarySource,verifiedInterfaceCases} from './runtime-source.generated';
import {copy as l,type LearningActivity} from './learning-activities';
export {verifiedInterfaceCases};
export const interfaceHelper=`// STUDENT TASK: parameters use percent duty and whole milliseconds.
// Return true only when the real runtime admits the command.
bool requestMove(jective::Runtime &robot, float leftPercent, float rightPercent, int64_t durationMs) {
  const auto result = jective::checkedMove(robot, leftPercent, rightPercent, durationMs);
  if (result != jective::MoveResult::Accepted) {
    Serial.println("request rejected; already disarmed");
  }
  return true; // TODO: do not hide a rejected request.
}
`;
export const correctedInterfaceHelper=interfaceHelper.replace('return true; // TODO: do not hide a rejected request.','return result == jective::MoveResult::Accepted;');
const sketch=(helper:string)=>`// Library source below is bundled from verified firmware, not a GPIO assignment.
${runtimeLibrarySource}
${helper}
jective::Runtime robot;
void setup() {
  Serial.begin(115200);
  // Intentionally not initialized or armed: no motor configuration is installed.
  const bool accepted = requestMove(robot, 10, 10, 100);
  Serial.println(accepted ? "accepted" : "not accepted");
}
void loop() { delay(1000); }
`;
export const functionsInterfaceArtifact={starter:sketch(interfaceHelper),reference:sketch(correctedInterfaceHelper)};
export const interfaceExercise:Extract<LearningActivity,{kind:'match'}>={id:'L39',kind:'match',prompt:l('Read the function contract and predict the result for each documented case.','Прочитай договор функции и предскажи результат каждого случая.','Функция шартын оқып, әр жағдайдың нәтижесін болжа.'),hint:l('Check finite duty and duration bounds first, then initialization and arming.','Сначала проверь ограничения мощности и времени, затем настройку и разрешение.','Алдымен қуат пен уақыт шегін, кейін баптау мен рұқсатты тексер.'),explanation:l('Accepted means API admission only. InvalidInput and RuntimeRejected both disarm. The return enum must be compared explicitly.','Accepted означает только принятие команды API. InvalidInput и RuntimeRejected отключают разрешение. Значение enum сравнивай явно.','Accepted тек API команданы қабылдағанын білдіреді. InvalidInput пен RuntimeRejected рұқсатты өшіреді. Enum мәнін анық салыстыр.'),items:[{id:'valid',label:l('Initialized and armed: 10%, 10%, 0.1 s','Настроен и разрешён: 10%, 10%, 0,1 с','Бапталған, рұқсат бар: 10%, 10%, 0,1 с')},{id:'too-fast',label:l('Initialized and armed: 31%, 10%, 0.1 s','Настроен и разрешён: 31%, 10%, 0,1 с','Бапталған, рұқсат бар: 31%, 10%, 0,1 с')},{id:'zero-duration',label:l('Initialized and armed: duration 0 s','Настроен и разрешён: длительность 0 с','Бапталған, рұқсат бар: ұзақтық 0 с')},{id:'not-ready',label:l('Never initialized: 10%, 10%, 0.1 s','Не настроен: 10%, 10%, 0,1 с','Бапталмаған: 10%, 10%, 0,1 с')},{id:'not-armed',label:l('Initialized but disarmed: 10%, 10%, 0.1 s','Настроен без разрешения: 10%, 10%, 0,1 с','Бапталған, рұқсат жоқ: 10%, 10%, 0,1 с')}],categories:['Accepted','InvalidInput','RuntimeRejected'].map(id=>({id,label:l(id,id,id)})),correct:{valid:'Accepted','too-fast':'InvalidInput','zero-duration':'InvalidInput','not-ready':'RuntimeRejected','not-armed':'RuntimeRejected'}};
