import {finalDemonstrationLesson} from './lesson-final-demonstration';
import {documentationLesson} from './lesson-documentation';
import {performanceImprovementLesson} from './lesson-performance-improvement';
import {reliabilityReviewLesson} from './lesson-reliability-review';
import {integratedPrototypeLesson} from './lesson-integrated-prototype';
import {capstoneProposalLesson} from './lesson-capstone-proposal';
import {responsibleAiLesson} from './lesson-responsible-ai';
import {sharingTask} from './sharing-learning';
import {substitutionTask} from './substitution-student-copy';
import {communicationTask} from './communication-student-copy';
import {buildErrorTask} from './build-error-student-copy';
const tasks:[string,string,string][]=[
 ['Open Studio, rename your project, then save it. Find the blocks, simulator and USB upload button.','Открой студию, дай проекту своё имя и сохрани его. Найди блоки, симулятор и кнопку загрузки по USB.','Студияны аш, жобаға өз атыңды беріп сақта. Блоктарды, симуляторды және USB жүктеу батырмасын тап.'],
 ['Identify the controller, sensor, motor and power supply in the worksheet. Trace the power path without connecting power.','Найди плату, датчик, мотор и питание в задании. Проследи путь питания, не включая устройство.','Тапсырмада тақша, сенсор, мотор мен қуатты тап. Қуатты қоспай, қорек жолын бақыла.'],
 ['Run the starter indicator program. Change a wait, predict the new rhythm, and run again.','Запусти начальную программу индикатора. Измени ожидание, предскажи новый ритм и проверь ещё раз.','Индикатордың бастапқы бағдарламасын іске қос. Күтуді өзгерт, жаңа ырғақты болжа да қайта тексер.'],
 ['Add the waits in your program. Use the timing experiment to compare your prediction with the result.','Сложи времена ожидания в программе. В опыте со временем сравни прогноз с результатом.','Бағдарламадағы күтулерді қос. Уақыт тәжірибесінде болжамды нәтижемен салыстыр.'],
 ['Add a short message to the starter program. Find where it appears in the simulator or board monitor.','Добавь короткое сообщение в начальную программу. Найди его в симуляторе или мониторе платы.','Бастапқы бағдарламаға қысқа хабар қос. Оны симулятордан не тақша мониторынан тап.'],
 ['Build a timer with a clear start and end signal. Change its duration and check when the end signal appears.','Собери таймер с понятным стартом и конечным сигналом. Измени длительность и проверь момент окончания.','Басталуы мен соңғы сигналы анық таймер құрастыр. Ұзақтығын өзгертіп, аяқталу уақытын тексер.'],
 ['Find a variable in the starter blocks. Change its value and explain which output changes.','Найди переменную в начальных блоках. Измени её значение и объясни, какой результат изменился.','Бастапқы блоктардан айнымалыны тап. Мәнін өзгертіп, қай нәтиже өзгергенін түсіндір.'],
 ['Try the smallest, middle and largest input values. Compare the mapped outputs and check their units.','Попробуй минимальное, среднее и максимальное входное значение. Сравни результаты и их единицы.','Ең аз, орта және ең үлкен кіріс мәнін сына. Нәтиже мен өлшем бірліктерін салыстыр.'],
 ['Test both branches of the condition. Change one comparison and predict which branch will run.','Проверь обе ветки условия. Измени одно сравнение и предскажи, какая ветка выполнится.','Шарттың екі тармағын тексер. Бір салыстыруды өзгертіп, қай тармақ орындалатынын болжа.'],
 ['Change a loop count and count the actual repetitions. Then make sure the loop can finish.','Измени число повторений цикла и посчитай реальные повторения. Проверь, что цикл умеет завершаться.','Цикл қайталау санын өзгертіп, нақты қайталауды сана. Циклдің аяқталатынын тексер.'],
 ['Find a function call. Change its parameter and compare the result without copying the function body.','Найди вызов функции. Измени параметр и сравни результат, не копируя команды внутри функции.','Функция шақыруын тап. Ішіндегі командаларды көшірмей, параметрін өзгертіп нәтижені салыстыр.'],
 ['Follow a state transition in the diagram. Trigger an event and check that the new state matches your prediction.','Проследи переход на схеме состояний. Вызови событие и сравни новое состояние со своим прогнозом.','Күй сұлбасындағы ауысуды бақыла. Оқиға жасап, жаңа күйді болжамыңмен салыстыр.'],
 ['Compare a bouncing input with a stable press. Count how many presses the program accepts.','Сравни дребезжащий сигнал со стабильным нажатием. Посчитай, сколько нажатий приняла программа.','Дірілдеген сигналды тұрақты басумен салыстыр. Бағдарлама қабылдаған басу санын сана.'],
 ['Change the illustrated voltage. Then run the analog experiment and compare voltage with counts.','Измени напряжение на иллюстрации. Затем выполни аналоговый опыт и сравни напряжение с отсчётами.','Суреттегі кернеуді өзгерт. Аналогтық тәжірибеде кернеу мен санды салыстыр.'],
 ['Compare several PWM percentages. Check the allowed range and predict which indicator setting is brighter.','Сравни несколько процентов ШИМ. Проверь границы и предскажи, при какой настройке индикатор ярче.','Бірнеше PWM пайызын салыстыр. Шектерді тексеріп, қай баптауда индикатор жарығы күштірек екенін болжа.'],
 ['Change the tone frequency and duration separately. Explain the difference between pitch and length.','Отдельно измени частоту и длительность звука. Объясни разницу между высотой и длиной ноты.','Дыбыстың жиілігі мен ұзақтығын бөлек өзгерт. Дыбыс биіктігі мен ұзақтығының айырмасын түсіндір.'],
 ['Run the distance experiment. Compare a valid reading with a missing reading; do not replace missing data with zero.','Выполни опыт с расстоянием. Сравни верное измерение с пропуском; не заменяй пропуск нулём.','Қашықтық тәжірибесін жаса. Жарамды және жоқ өлшемді салыстыр; жоқ деректі нөлмен алмастырма.'],
 ['Inspect the dashboard. Find the units, time and a missing measurement before describing the graph.','Изучи панель измерений. Найди единицы, время и пропуск данных, прежде чем описывать график.','Өлшем панелін қара. Графикті сипаттамас бұрын бірлік, уақыт пен жоқ деректі тап.'],
 ['Complete the rover inspection below. Explain why each component needs the mounting or power path you selected.','Выполни осмотр ровера ниже. Объясни, зачем каждому компоненту выбранное крепление и путь питания.','Төмендегі ровер тексерісін орында. Әр компонентке таңдалған бекітпе мен қуат жолының қажет екенін түсіндір.'],
 ['Run the safe motor test below. Trigger Stop and a fault; check that movement does not resume on its own.','Выполни безопасный тест моторов ниже. Нажми остановку и вызови ошибку; проверь, что движение само не возобновляется.','Төмендегі қауіпсіз мотор сынағын орында. Тоқтату мен қате жаса; жүрістің өздігінен жалғаспайтынын тексер.'],
 ['Try equal wheel speeds, then different speeds. Predict the turning direction before each run.','Попробуй одинаковые, затем разные скорости колёс. Перед каждым запуском предскажи направление поворота.','Дөңгелектерді бірдей, кейін әртүрлі жылдамдықпен жүргіз. Әр іске қосу алдында бұрылу бағытын болжа.'],
 ['Compare an immediate speed change with a ramp. Interrupt the ramp and check the stop behavior.','Сравни резкую смену скорости с плавным разгоном. Прерви разгон и проверь остановку.','Жылдамдықты күрт өзгерту мен біртіндеп үдеуді салыстыр. Үдеуді үзіп, тоқтауды тексер.'],
 ['Change the run time. Predict the travel distance and compare it with the recorded model result.','Измени время движения. Предскажи путь и сравни его с записанным результатом модели.','Жүріс уақытын өзгерт. Жолды болжап, оны жазылған модель нәтижесімен салыстыр.'],
 ['Run a square route. Compare the start and finish, change one turn parameter, and repeat.','Выполни квадратный маршрут. Сравни старт и конец, измени один параметр поворота и повтори.','Шаршы жолды орында. Басталу мен аяқталуды салыстыр, бір бұрылыс параметрін өзгертіп қайтала.'],
 ['Test far, near and missing distance readings. Check which cases stop the robot.','Проверь далёкое, близкое и отсутствующее измерение. Выясни, в каких случаях робот остановится.','Алыс, жақын және жоқ өлшемді тексер. Қай жағдайда робот тоқтайтынын анықта.'],
 ['Run the avoidance experiment. Follow the stop, inspection, turn and retry states; test a blocked route.','Выполни опыт объезда. Проследи остановку, проверку, поворот и повторную попытку; испытай закрытый путь.','Кедергіні айналып өту тәжірибесін жаса. Тоқтау, тексеру, бұрылу мен қайта көруді бақыла; жабық жолды сына.'],
 ['Compare light and dark samples. Choose a threshold and test a value near the uncertain boundary.','Сравни светлые и тёмные отсчёты. Выбери границу и проверь значение рядом с неоднозначной областью.','Ашық пен қара өлшемдерді салыстыр. Шек таңдап, белгісіз аралыққа жақын мәнді тексер.'],
 ['Test the robot left of, right of and on the line. Then test a lost line and check the safe response.','Проверь робота слева, справа и на линии. Затем потеряй линию и проверь безопасную реакцию.','Роботты сызықтың солында, оңында және үстінде сына. Кейін сызықты жоғалтып, қауіпсіз әрекетін тексер.'],
 ['Compare small, medium and large gains in the same experiment. Describe both the route and error.','Сравни малый, средний и большой коэффициенты в одном опыте. Опиши маршрут и ошибку.','Бір тәжірибеде аз, орта және үлкен коэффициентті салыстыр. Жол мен қатені сипатта.'],
 ['Run the combined course. Check that an obstacle or missing measurement takes priority over the finish.','Пройди составной маршрут. Проверь, что препятствие или пропуск измерения важнее финиша.','Біріктірілген жолды орында. Кедергі мен жоқ өлшемнің мәреден басым екенін тексер.'],
 ['Convert wheel counts into distance. Compare forward travel, reverse travel and a counter reset.','Переведи отсчёты колеса в путь. Сравни движение вперёд, назад и сброс счётчика.','Дөңгелек санын қашықтыққа айналдыр. Алға, артқа жүру мен санағышты нөлдеуді салыстыр.'],
 ['Compare requested and measured speed under load. Test missing feedback and inspect the stop.','Сравни нужную и измеренную скорость под нагрузкой. Потеряй обратную связь и проверь остановку.','Жүктемеде сұралған және өлшенген жылдамдықты салыстыр. Кері байланысты жоғалтып, тоқтауды тексер.'],
 ['Change one PID setting at a time. Compare error and command limits instead of judging only one peak.','Меняй по одной настройке ПИД. Сравни ошибку и ограничения команды, а не только один пик.','Бір уақытта бір PID баптауын өзгерт. Бір шыңды ғана емес, қате мен команда шегін салыстыр.'],
 ['Request an angle inside and outside the safe range. Test Stop and missing feedback in the model.','Задай угол внутри и за пределами диапазона. Проверь остановку и потерю обратной связи в модели.','Қауіпсіз аралықтың ішінде және сыртында бұрыш сұра. Модельде тоқтау мен жоқ кері байланысты тексер.'],
 ['Compare heading with and without bias correction. Test missing data; keep model truth separate from the estimate.','Сравни угол с поправкой смещения и без неё. Проверь пропуск данных; отличай оценку от угла модели.','Ығысу түзетілген және түзетілмеген бұрышты салыстыр. Жоқ деректі сына; бағаны модель бұрышынан ажырат.'],
 ['Compare timed and feedback stops under the same speed changes. Keep every trial, including unexpected results.','Сравни остановку по времени и обратной связи при одинаковых изменениях скорости. Сохрани все результаты, включая неожиданные.','Бірдей жылдамдық өзгерісінде уақыт пен кері байланыс тоқтауын салыстыр. Күтпегенін қоса, барлық нәтижені сақта.'],
];
export const studentTasks:Record<string,Record<'en'|'ru'|'kk',string>>=Object.fromEntries(tasks.map(([en,ru,kk],i)=>['L'+String(i+1).padStart(2,'0'),{en,ru,kk}]));

studentTasks.L37={en:'Match the generated lines, save the original blocks, then edit and save an independent Code copy. Compile valid source and repair a deliberate syntax error.',ru:'Сопоставь строки кода, сохрани исходные блоки и отдельно изменённую копию кода. Проверь компиляцию правильного текста и исправь намеренную синтаксическую ошибку.',kk:'Код жолдарын сәйкестендір, бастапқы блоктарды және бөлек өңделген код көшірмесін сақта. Дұрыс мәтінді компиляциялап, әдейі синтаксис қатесін түзет.'};

studentTasks.L38={en:'Predict integer and floating results, compare boundary cases, then correct and save the text sketch in Studio. Compile a scope mistake, read its diagnostic and restore valid code.',ru:'Предскажи целые и дробные результаты, сравни границы, затем исправь и сохрани текст в студии. Проверь ошибку области видимости компилятором, прочитай сообщение и восстанови код.',kk:'Бүтін және бөлшек нәтижені болжа, шекараны салыстыр, мәтінді студияда түзетіп сақта. Көріну қатесін компилятормен тексер, хабарды оқып, кодты қалпына келтір.'};

studentTasks.L39={en:'Predict API outcomes, repair the helper return in a separate Code copy and compile. Document its parameters and failure behavior; export predictions with the preverified native comparison.',ru:'Предскажи ответы API, исправь return в отдельной копии кода и скомпилируй. Опиши параметры и действия при отказе; экспортируй сравнение с заранее проверенным тестом C++.',kk:'API нәтижесін болжа, бөлек код көшірмесінде return түзетіп, компиляцияла. Параметр мен бас тартуды сипатта; бұрын тексерілген C++ салыстыруын экспортта.'};
studentTasks.L40={en:'Predict stop latency, compare rollover traces, then replace blocking waits in an independent Code copy. Compile and export the model comparison separately from actual execution.',ru:'Предскажи задержку остановки и сравни переполнение. Замени ожидания в отдельной копии кода. Скомпилируй и сохрани модель отдельно от настоящего выполнения.',kk:'Тоқтау кідірісін болжап, айналу диаграммасын салыстыр. Бөлек код көшірмесінде күтуді алмастыр. Компиляциялап, модельді нақты орындаудан бөлек сақта.'};

studentTasks.L41={en:'Inspect a bounded collection, order the validation steps and repair the reader in an independent Code copy. Export manually entered records with origin, units and fault statuses.',ru:'Проверь ограниченную коллекцию, упорядочь проверку и исправь чтение в отдельной копии кода. Экспортируй вручную введённые записи с источником, единицами и статусами ошибок.',kk:'Шектеулі жинақты тексеріп, тексеру ретін қой, бөлек код көшірмесінде оқуды түзет. Қолмен енгізілген жазбаны көз, бірлік және қате мәртебелерімен экспортта.'};

studentTasks.L42={en:'Match each responsibility to a file, predict the phase boundary, repair unknownPhase through the compiler diagnostic and save/export all four files.',ru:'Сопоставь обязанности с файлами, предскажи границу фазы, исправь unknownPhase через сообщение компилятора и сохрани/экспортируй все четыре файла.',kk:'Міндеттерді файлмен сәйкестендір, кезең шекарасын болжа, компилятор хабарымен unknownPhase түзетіп, төрт файлды бірге сақта және экспортта.'};

studentTasks.L43={en:'Predict three short movements, check your coordinate answers, design a valid field and export/reopen it. Load the starter to inspect actual simulated motion separately.',ru:'Предскажи три коротких движения, проверь ответы по координатам, создай допустимое поле и экспортируй/открой его. Загрузи начальный проект для отдельной проверки настоящего движения в симуляции.',kk:'Үш қысқа қозғалысты болжа, координата жауабын тексер, жарамды алаң жасап экспортта және қайта аш. Нақты симуляция қозғалысын бөлек бақылау үшін бастапқы жобаны жүкте.'};

studentTasks.L44={en:'Choose the controlled conditions. Compare repeated runs, change only the comparison seed, then test zero noise and export your report.',ru:'Выбери неизменные условия. Сравни повторы, измени только seed сравнения, затем проверь нулевой шум и экспортируй отчёт.',kk:'Бірдей шартты таңда. Қайталауды салыстыр, тек салыстыру seed өзгерт, кейін нөл шуды тексеріп, есепті экспортта.'};

studentTasks.L45={en:'Predict four failure causes, compare the scenario traces and check your matching answers.',ru:'Предскажи четыре причины отказа, сравни трассы сценариев и проверь ответы на сопоставление.',kk:'Төрт ақау себебін болжа, сценарий іздерін салыстыр және сәйкестендіру жауаптарын тексер.'};

studentTasks.L46={en:'Repeat a seeded series, compare zero noise, analyze optional entered readings and check your conclusions.',ru:'Повтори серию с seed, сравни нулевой шум, разбери свои показания при наличии и проверь выводы.',kk:'Seed бар жиынды қайтала, нөл шуды салыстыр, өз көрсеткішің болса талда және қорытындыны тексер.'};

studentTasks.L47={en:'Predict two verdicts, evaluate both programs under one scenario, shorten the deadline and explain the changed results.',ru:'Предскажи два вердикта, проверь обе программы в одном сценарии, сократи срок и объясни изменения.',kk:'Екі үкімді болжа, екі бағдарламаны бір сценарийде тексер, мерзімді қысқарт және өзгерісті түсіндір.'};

studentTasks.L48={en:'Record your prediction. Compare both thresholds in at least two worlds, inspect a recorded frame, export the report and explain one limitation.',ru:'Запиши предсказание. Сравни оба порога хотя бы в двух полях, изучи записанный кадр, скачай отчёт и объясни ограничение.',kk:'Болжамыңды жаз. Екі шекті кемінде екі алаңда салыстыр, жазылған кадрды қара, есепті жүктеп, бір шектеуді түсіндір.'};

studentTasks.L49={en:'Write a mission and three test cases: normal, failure and boundary. Add a measurable rule and safe failure state, save your plan and export it without inventing results.',ru:'Запиши миссию и три теста: обычный, отказ и границу. Добавь измеримое правило и безопасное состояние при отказе, сохрани план и скачай его, не выдумывая результаты.',kk:'Миссия мен үш сынақты жаз: қалыпты, ақау және шекара. Өлшенетін ереже мен ақаудағы қауіпсіз күйді қос, жоспарды сақтап жүкте, нәтиже ойдан шығарма.'};

studentTasks.L50=buildErrorTask;

studentTasks.L51=communicationTask;

studentTasks.L52=substitutionTask;


studentTasks.L53=sharingTask;

studentTasks.L54=responsibleAiLesson.activity;

studentTasks.L55=capstoneProposalLesson.activity;

studentTasks.L56=integratedPrototypeLesson.activity;

studentTasks.L57=reliabilityReviewLesson.activity;

studentTasks.L58=performanceImprovementLesson.activity;

studentTasks.L59=documentationLesson.activity;
studentTasks.L60=finalDemonstrationLesson.activity;
