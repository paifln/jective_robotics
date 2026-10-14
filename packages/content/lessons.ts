import {finalDemonstrationLesson} from './lesson-final-demonstration';
import {documentationLesson} from './lesson-documentation';
import {performanceImprovementLesson} from './lesson-performance-improvement';
import {performanceImprovementArtifact} from './performance-improvement';
import {reliabilityReviewLesson} from './lesson-reliability-review';
import {reliabilityReviewArtifact} from './reliability-review';
import {integratedPrototypeArtifact} from './integrated-prototype';
import {integratedPrototypeLesson} from './lesson-integrated-prototype';
import {capstoneProposalLesson} from './lesson-capstone-proposal';
import {responsibleAiLesson} from './lesson-responsible-ai';
import {sharingLesson} from './lesson-sharing';
import {substitutionLesson} from './lesson-substitution';
import {communicationLesson} from './lesson-communication';
import {buildErrorsLesson} from './lesson-build-errors';
import {repeatableLesson} from './lesson-repeatable';
import {collisionLesson} from './lesson-collision';
import {uncertaintyLesson} from './lesson-uncertainty';
import {challengeTestLesson} from './lesson-challenge-test';
import {investigationLesson} from './lesson-investigation';
import {requirementMatrixLesson} from './lesson-requirement-matrix';
import {investigationArtifact} from './investigation-artifact';
import {challengeTestArtifact} from './challenge-test-artifact';
import {uncertaintyArtifact} from './uncertainty-artifact';
import {collisionArtifact} from './collision-artifact';
import {repeatableArtifact} from './repeatable-artifact';
import {worldCoordinatesLesson} from './lesson-world-coordinates';
import {worldCoordinateArtifact} from './world-coordinate-artifact';
import {multiFileLesson} from './lesson-multifile';
import {functionsInterfaceLesson} from './lesson-functions-interface';
import {nonblockingTimeLesson} from './lesson-nonblocking-time';
import {collectionsLesson} from './lesson-collections';
import {typesScopeLesson} from './lesson-types-scope';
import {blocksCodeLesson} from './lesson-blocks-code';
import {blocksCodeArtifact} from './blocks-code';
import {LessonSchema,type Lesson,type LessonArtifact} from './index';
import {indicatorLesson} from './lesson-indicator';
import {partsLesson} from './lesson-parts';
import {timingLesson} from './lesson-timing';
import {messagesLesson} from './lesson-messages';
import {miniLesson} from './lesson-mini';
import {variablesLesson,variablesArtifact} from './lesson-variables';
import {mappingLesson,mappingArtifact} from './lesson-mapping';
import {decisionsLesson,decisionsArtifact} from './lesson-decisions';
import {loopsLesson,loopsArtifact} from './lesson-loops';
import {functionsLesson,functionsArtifact} from './lesson-functions';
import {stateMachineLesson,stateMachineArtifact} from './lesson-state-machine';
import {debounceLesson,debounceArtifact} from './lesson-debounce';
import {analogLesson,analogArtifact} from './lesson-analog';
import {pwmLesson,pwmArtifact} from './lesson-pwm';
import {soundLesson,soundArtifact} from './lesson-sound';
import {distanceLesson,distanceArtifact} from './lesson-distance';
import {dashboardLesson} from './lesson-dashboard';
import {dashboardArtifact} from './dashboard-artifact';
import {roverLesson} from './lesson-rover';
import {motorTestLesson} from './lesson-motor-test';
import {steeringLesson} from './lesson-steering';
import {rampingLesson} from './lesson-ramping';
import {timedMotionLesson} from './lesson-timed-motion';
import {squareRouteLesson} from './lesson-square-route';
import {squareRouteArtifact} from './square-route-artifact';
import {obstacleStopLesson} from './lesson-obstacle-stop';
import {obstacleStopArtifact} from './obstacle-stop-artifact';
import {avoidanceLesson} from './lesson-avoidance';
import {avoidanceArtifact} from './avoidance-artifact';
import {lineCalibrationLesson} from './lesson-line-calibration';
import {lineCalibrationArtifact} from './line-calibration-artifact';
import {lineFollowingLesson} from './lesson-line-following';
import {lineFollowingArtifact} from './line-following-artifact';
import {proportionalLineLesson} from './lesson-proportional-line';
import {proportionalLineArtifact} from './proportional-line';
import {courseChallengeLesson} from './lesson-course-challenge';
import {courseArtifact} from './course-challenge';
import {encoderLesson} from './lesson-encoder';
import {encoderArtifact} from './encoder-experiment';
import {wheelSpeedLesson} from './lesson-wheel-speed';
import {wheelSpeedArtifact} from './wheel-speed-experiment';
import {pidLesson} from './lesson-pid';
import {pidArtifact} from './pid-experiment';
import {servoLesson} from './lesson-servo';
import {servoArtifact} from './servo-experiment';
import {orientationLesson} from './lesson-orientation';
import {orientationArtifact} from './orientation-experiment';
import {precisionLesson} from './lesson-precision';
import {precisionArtifact} from './precision-motion';
import {timedMotionProgram} from './timed-motion';
import {steeringProgram,steeringWorld} from './differential-experiment';
const l=(en:string,kk:string,ru:string)=>({en,kk,ru});
export const lessons:Lesson[]=[LessonSchema.parse({
 id:'L01',title:l('Exploring the studio','Студияны зерттеу','Знакомство со студией'),prerequisites:[],duration:45,level:l('Beginner; ages 10+ with guidance','Бастапқы деңгей; 10 жастан бастап, жетекшілікпен','Начальный уровень; от 10 лет с сопровождением'),capabilities:['software'],translationStatus:'draft-review-required',
 objectives:l('Create and rename a project, preserve it through a close-and-reopen cycle, and distinguish the evidence produced by Blocks, Code, Simulation and Hardware. Explain which tasks require an actual board and which remain useful offline.','Жоба құрып, атауын өзгертіңіз, жабу және қайта ашу арқылы сақталғанын тексеріңіз. Блоктар, Код, Симуляция және Аппараттық жұмыс беретін дәлелдерді ажыратыңыз. Нақты тақша қажет болатын жұмыстарды және желісіз орындалатын жұмыстарды түсіндіріңіз.','Создайте и переименуйте проект, проверьте его сохранность после закрытия и повторного открытия. Различайте доказательства, полученные в Блоках, Коде, Симуляции и при работе с оборудованием. Объясните, где нужна настоящая плата и что доступно без сети.'),
 safety:l('Leave motors and external power disconnected. Selecting a board profile describes a target; it does not identify a plugged-in device or approve a wiring diagram. The provisional JECTIVE profile has no official pin assignment. Do not dismiss that restriction to make an experiment run.','Қозғалтқыштар мен сыртқы қорек қосылмасын. Тақша профилін таңдау мақсатты құрылғыны сипаттайды; ол жалғанған құрылғыны анықтамайды және сым сұлбасын мақұлдамайды. JECTIVE прототипінің ресми түйреуіш тағайындауы жоқ. Тәжірибені іске қосу үшін бұл шектеуді елемеуге болмайды.','Оставьте моторы и внешнее питание отключёнными. Профиль описывает целевую плату, но не определяет подключённое устройство и не подтверждает схему. У прототипа JECTIVE нет официальной распиновки. Не обходите ограничение ради запуска.'),
 explanation:l('A robotics project combines a description of behaviour with assumptions about the machine that will perform it. In Blocks mode, connected shapes represent instructions. The C++ pane is a derived preview: moving a block changes the preview. In Code mode, the text becomes an independent source document, while the original blocks remain preserved. A simulator executes the supported block representation in a mathematical world. It can help you test order, timing and motion, but cannot prove that a wire, motor or sensor is connected correctly. Hardware compilation translates the selected source for a particular board. Successful compilation proves that the compiler accepted that source and created artifacts; it does not prove an upload or physical movement.\n\nSaving and exporting answer different questions. Save project keeps an editable file at a location you choose. Local autosave maintains recovery information in the workspace database after editing stops. A portable archive is a copy for another computer. A backup preserves the entire local workspace, including classroom records. None of these files should contain an AI API key. Keep the project name meaningful so that a future reader can identify the investigation without opening every file.','Робот жобасы әрекет сипаттамасын және оны орындайтын құрылғы туралы жорамалдарды біріктіреді. Блоктар режимінде байланысқан пішіндер нұсқауларды білдіреді. C++ терезесі туынды көрініс болып табылады: блокты жылжыту оны өзгертеді. Код режимінде мәтін дербес бастапқы құжатқа айналады, ал бастапқы блоктар сақталады. Симулятор қолдау көрсетілетін блоктық үлгіні математикалық ортада орындайды. Ол реттілікті, уақытты және қозғалысты тексеруге көмектеседі, бірақ сымның, мотордың немесе сенсордың дұрыс қосылғанын дәлелдемейді. Аппараттық компиляция таңдалған кодты белгілі тақшаға аударады. Сәтті компиляция компилятор кодты қабылдап, файлдар жасағанын ғана дәлелдейді; ол жүктеуді не нақты қозғалысты дәлелдемейді.\n\nСақтау мен экспорт әртүрлі міндет атқарады. Жобаны сақтау сіз таңдаған жерде өңделетін файл жасайды. Жергілікті автосақтау өңдеу тоқтағаннан кейін жұмыс кеңістігінің дерекқорында қалпына келтіру деректерін сақтайды. Тасымалданатын мұрағат басқа компьютерге арналған көшірме болады. Сақтық көшірме бүкіл жергілікті кеңістікті, соның ішінде сынып жазбаларын сақтайды. Бұл файлдардың ешқайсысында ЖИ API кілті болмауы керек. Болашақ оқырман барлық файлды ашпай-ақ жұмысты тануы үшін жоба атауын мағыналы таңдаңыз.','Проект робота объединяет описание поведения и предположения о машине, которая его выполнит. В режиме Блоков соединённые фигуры обозначают инструкции. Панель C++ показывает производный код: изменение блока меняет этот текст. В режиме Кода текст становится независимым документом, а исходные блоки сохраняются. Симулятор выполняет поддерживаемое представление блоков в математическом мире. Он помогает проверить порядок, время и движение, но не подтверждает правильность подключения проводов, моторов или датчиков. Компиляция переводит выбранный исходный текст для определённой платы. Её успех доказывает, что компилятор принял код и создал файлы; он не доказывает прошивку или физическое движение.\n\nСохранение и экспорт решают разные задачи. Сохранение проекта создаёт редактируемый файл в выбранном месте. Автосохранение хранит данные восстановления в базе рабочего пространства после прекращения редактирования. Переносимый архив служит копией для другого компьютера. Резервная копия сохраняет всё локальное пространство, включая записи класса. Ни один из этих файлов не должен содержать ключ API ИИ. Выберите содержательное имя, чтобы будущий читатель мог узнать исследование, не открывая все файлы.'),
 workedExample:l('Consider a project named Corridor indicator prediction. Its block loop turns the indicator on, waits 500 milliseconds, turns it off and waits again. Before running, write four separate predictions: what the generated source will contain; what the simulator will report; what a compiler can establish; and what would require physical observation. The expected source contains two digital writes and two waits. The simulator reports timed states. A real board observation remains NOT RUN when no board is connected.','«Дәліз индикаторын болжау» жобасын қарастырыңыз. Цикл индикаторды қосып, 500 миллисекунд күтеді, өшіреді және қайта күтеді. Іске қоспай тұрып төрт болжам жазыңыз: жасалған кодта не болады; симулятор не көрсетеді; компилятор нені анықтай алады; неге нақты бақылау қажет. Кодта екі цифрлық жазу және екі күту болады. Симулятор уақытпен белгіленген күйлерді көрсетеді. Тақша жалғанбаса, нақты бақылаудың күйі «ОРЫНДАЛМАДЫ» болып қалады.','Рассмотрите проект «Прогноз индикатора в коридоре». Цикл включает индикатор, ждёт 500 миллисекунд, выключает его и снова ждёт. До запуска запишите четыре прогноза: что будет в коде; что покажет симулятор; что может установить компилятор; для чего нужно физическое наблюдение. Код содержит две цифровые записи и два ожидания. Симулятор показывает состояния с временем. Без платы физическая проверка остаётся НЕ ВЫПОЛНЕНО.'),
 activity:l('Create a fresh project and rename it using both a descriptive phrase and your learner identifier. Keep the generic reference profile for this software exercise. Save the file in a folder whose name contains spaces, then change one wait value and save again. Record the new revision displayed by the application. Close the application normally, reopen it and explicitly choose either the saved file or the offered local recovery. Check the project name, block connections, wait value and source preview against your notebook. Export a portable archive and import that copy as a separate check. A matching title alone is insufficient: compare the actual behaviour-defining values.','Жаңа жоба құрып, атауына сипаттамалық тіркес пен оқушы идентификаторын қосыңыз. Бұл бағдарламалық жұмыс үшін жалпы анықтамалық профильді қалдырыңыз. Файлды атауында бос орындары бар қапшыққа сақтаңыз, бір күту мәнін өзгертіп, қайта сақтаңыз. Қолданба көрсеткен жаңа нұсқаны жазыңыз. Қолданбаны қалыпты жабыңыз, қайта ашыңыз және сақталған файлды немесе ұсынылған жергілікті қалпына келтіруді саналы түрде таңдаңыз. Жоба атауын, блок байланыстарын, күту мәнін және код көрінісін дәптермен салыстырыңыз. Тасымалданатын мұрағатты экспорттап, көшірмені жеке тексеру ретінде импорттаңыз. Атаудың сәйкестігі жеткіліксіз: әрекетті анықтайтын нақты мәндерді салыстырыңыз.','Создайте новый проект и включите в имя описание и идентификатор ученика. Для программного упражнения оставьте общий справочный профиль. Сохраните файл в папке с пробелами в имени, измените одно ожидание и сохраните снова. Запишите новую ревизию, показанную приложением. Закройте приложение обычным способом, откройте снова и явно выберите сохранённый файл либо предложенное восстановление. Сравните имя, соединения блоков, время ожидания и код с записями. Экспортируйте переносимый архив и импортируйте копию для отдельной проверки. Одного совпадения заголовка мало: сравните значения, определяющие поведение.'),
 challenge:l('Make a copy with a different wait duration, convert only that copy to Code mode and edit its printed message. Explain why the preserved blocks cannot be used as evidence for the edited C++ behaviour. Give another learner your portable archive and ask them to identify the mode and one parameter without your help.','Күту уақыты басқа көшірме жасаңыз, тек сол көшірмені Код режиміне ауыстырып, басылатын хабарды өзгертіңіз. Сақталған блоктар неге өңделген C++ әрекетінің дәлелі бола алмайтынын түсіндіріңіз. Мұрағатты басқа оқушыға беріп, көмексіз режимді және бір параметрді анықтауын сұраңыз.','Создайте копию с другим ожиданием, переведите только её в Код и измените печатаемое сообщение. Объясните, почему сохранённые блоки не доказывают поведение изменённого C++. Передайте архив другому ученику и попросите без подсказки определить режим и один параметр.'),
 observations:l('The restored values should match the chosen saved revision. Autosaved does not mean that an external project file was overwritten. A Code project rejects block simulation with an explanation. No action in this exercise should open a serial port or move a motor.','Қалпына келтірілген мәндер таңдалған сақталған нұсқаға сәйкес болуы керек. Автосақтау сыртқы жоба файлы қайта жазылды дегенді білдірмейді. Код жобасы блоктық симуляцияны түсіндірмемен қабылдамайды. Бұл жұмыста ешбір әрекет сериялық портты ашпауы не моторды қозғауы керек.','Восстановленные значения должны совпасть с выбранной сохранённой ревизией. Автосохранение не означает перезапись внешнего файла. Проект в режиме Кода отклоняет симуляцию блоков с объяснением. Ни одно действие упражнения не должно открывать порт или двигать мотор.'),
 questions:[{question:l('Does a successful compile prove movement?','Сәтті компиляция қозғалысты дәлелдей ме?','Доказывает ли компиляция движение?'),answer:l('No. It proves compiler acceptance and artifacts; upload and physical observations are separate.','Жоқ. Ол компилятор қабылдағанын және файлдар жасалғанын дәлелдейді; жүктеу мен нақты бақылау бөлек.','Нет. Она подтверждает принятие кода и создание файлов; прошивка и наблюдения проверяются отдельно.')},{question:l('What is preserved during conversion?','Түрлендіруде не сақталады?','Что сохраняется при преобразовании?'),answer:l('The original block workspace remains, but edited C++ is independent.','Бастапқы блок кеңістігі сақталады, бірақ өңделген C++ дербес болады.','Исходные блоки остаются, но изменённый C++ независим.')},{question:l('How can you prove recovery worked?','Қалпына келтіруді қалай дәлелдейсіз?','Как доказать успешное восстановление?'),answer:l('Compare name, values, connections and source against a recorded revision, not only the title.','Атауды ғана емес, мәндерді, байланыстарды және кодты жазылған нұсқамен салыстырыңыз.','Сравните имя, значения, связи и код с записанной ревизией, а не только заголовок.')}],
 troubleshooting:l('If a saved file differs, check which copy and revision you opened. If a conflict is reported, preserve both copies instead of forcing a replacement. If a profile is provisional, use simulation and leave hardware blocked.','Сақталған файл өзгеше болса, қай көшірме мен нұсқаны ашқаныңызды тексеріңіз. Қақтығыс болса, күштеп ауыстырмай, екі көшірмені сақтаңыз. Профиль алдын ала болса, симуляцияны қолданып, аппараттық жұмысты бұғатталған күйде қалдырыңыз.','Если файл отличается, проверьте открытые копию и ревизию. При конфликте сохраните обе копии вместо принудительной замены. Для предварительного профиля используйте симуляцию, оставив оборудование заблокированным.'),
 teacher:l('Allow 10 minutes for prediction, 20 for persistence checks and 15 for peer explanation. For younger learners, supply a checklist and demonstrate file locations. Extend with deliberate conflicting copies. Review translations with a fluent technical educator.','Болжауға 10 минут, сақтауды тексеруге 20, өзара түсіндіруге 15 минут бөліңіз. Кіші оқушыларға тексеру тізімін беріп, файл орындарын көрсетіңіз. Қосымшада қақтығысқан көшірмелерді зерттеңіз. Аудармаларды техниканы білетін тіл маманымен тексеріңіз.','Отведите 10 минут на прогноз, 20 на сохранение и 15 на объяснение партнёру. Младшим дайте список проверок и покажите расположение файлов. Для расширения используйте конфликтующие копии. Переводы требуют проверки техническим педагогом.'),
 evidence:l('Submit the recovered project, a before-and-after revision table, the portable archive and four sentences distinguishing each mode. Award one point each for correct recovery, preserved parameters, a usable archive and a justified evidence distinction.','Қалпына келтірілген жобаны, нұсқалардың салыстыру кестесін, мұрағатты және режимдерді ажырататын төрт сөйлемді тапсырыңыз. Дұрыс қалпына келтіруге, параметр сақталуына, жарамды мұрағатқа және дәлелдерді негіздеп ажыратуға бір-бір ұпай беріңіз.','Сдайте восстановленный проект, таблицу ревизий, архив и четыре предложения о различиях режимов. По одному баллу: восстановление, сохранённые параметры, пригодный архив и обоснованное различение доказательств.')
}),partsLesson,indicatorLesson,timingLesson,messagesLesson,miniLesson,variablesLesson,mappingLesson,decisionsLesson,loopsLesson];
export const artifacts:Record<string,LessonArtifact>={L01:{starter:{setup:[],loop:[{kind:'led',on:true},{kind:'wait',ms:500},{kind:'led',on:false},{kind:'wait',ms:500}]},reference:{setup:[{kind:'print',text:'Recovered project check'}],loop:[{kind:'led',on:true},{kind:'wait',ms:750},{kind:'led',on:false},{kind:'wait',ms:250}]}}};
artifacts.L07=variablesArtifact;
artifacts.L08=mappingArtifact;
artifacts.L09=decisionsArtifact;
artifacts.L10=loopsArtifact;
lessons.push(functionsLesson);
artifacts.L11=functionsArtifact;
lessons.push(stateMachineLesson);
artifacts.L12=stateMachineArtifact;
lessons.push(debounceLesson);
artifacts.L13=debounceArtifact;
lessons.push(analogLesson);
artifacts.L14=analogArtifact;
lessons.push(pwmLesson);
artifacts.L15=pwmArtifact;
lessons.push(soundLesson);
artifacts.L16=soundArtifact;
lessons.push(distanceLesson);
artifacts.L17=distanceArtifact;
lessons.push(dashboardLesson);
artifacts.L18=dashboardArtifact;
lessons.push(roverLesson);
lessons.push(motorTestLesson);
lessons.push(steeringLesson);
lessons.push(rampingLesson);
lessons.push(timedMotionLesson);
lessons.push(squareRouteLesson);
artifacts.L24=squareRouteArtifact;
lessons.push(obstacleStopLesson);
artifacts.L25=obstacleStopArtifact;
lessons.push(avoidanceLesson);
artifacts.L26=avoidanceArtifact;
lessons.push(lineCalibrationLesson);
artifacts.L27=lineCalibrationArtifact;
lessons.push(lineFollowingLesson);
artifacts.L28=lineFollowingArtifact;
lessons.push(proportionalLineLesson);
artifacts.L29=proportionalLineArtifact;
lessons.push(courseChallengeLesson);
artifacts.L30=courseArtifact;
lessons.push(encoderLesson);
artifacts.L31=encoderArtifact;
lessons.push(wheelSpeedLesson);
artifacts.L32=wheelSpeedArtifact;
lessons.push(pidLesson);
artifacts.L33=pidArtifact;
lessons.push(servoLesson);
artifacts.L34=servoArtifact;
lessons.push(orientationLesson);
artifacts.L35=orientationArtifact;
lessons.push(precisionLesson);
artifacts.L36=precisionArtifact;
const timedReference=timedMotionProgram();timedReference.setup[5]={kind:'wait',ms:1180};
artifacts.L23={starter:timedMotionProgram(),reference:timedReference,world:{...structuredClone(steeringWorld),id:'L23-timed-motion'}};
artifacts.L21={starter:steeringProgram('equal'),reference:steeringProgram('unequal'),world:steeringWorld};
artifacts.L03={starter:{setup:[],loop:[{kind:'led',on:true},{kind:'wait',ms:500},{kind:'led',on:false},{kind:'wait',ms:500}]},reference:{setup:[{kind:'print',text:'Starting unequal intervals'}],loop:[{kind:'led',on:true},{kind:'wait',ms:200},{kind:'led',on:false},{kind:'wait',ms:800}]}};

artifacts.L04={starter:{setup:[{kind:'led',channel:2,on:false}],loop:[{kind:'led',on:true},{kind:'wait',ms:500},{kind:'led',on:false},{kind:'led',channel:2,on:true},{kind:'wait',ms:500},{kind:'led',channel:2,on:false}]},reference:{setup:[{kind:'led',channel:2,on:false}],loop:[{kind:'led',on:true},{kind:'wait',ms:300},{kind:'led',on:false},{kind:'led',channel:2,on:true},{kind:'wait',ms:700},{kind:'led',channel:2,on:false}]}};

artifacts.L05={starter:{setup:[{kind:'print',text:'Hello'}],loop:[{kind:'print',text:'Hello'},{kind:'wait',ms:1000}]},reference:{setup:[{kind:'print',text:'SIMULATION START'}],loop:[{kind:'print',text:'PHASE_A'},{kind:'wait',ms:250},{kind:'print',text:'PHASE_B'},{kind:'wait',ms:750}]}};

artifacts.L06={starter:{setup:[{kind:'print',text:'TIMER_START'}],loop:[{kind:'print',text:'WORK'},{kind:'led',on:true},{kind:'wait',ms:600},{kind:'print',text:'BREAK'},{kind:'wait',ms:400}]},reference:{setup:[{kind:'print',text:'TIMER_START'}],loop:[{kind:'print',text:'WORK'},{kind:'led',on:true},{kind:'wait',ms:600},{kind:'print',text:'BREAK'},{kind:'led',on:false},{kind:'wait',ms:400}]}};

lessons.push(blocksCodeLesson);
artifacts.L37=blocksCodeArtifact;

lessons.push(typesScopeLesson);

lessons.push(functionsInterfaceLesson);
lessons.push(nonblockingTimeLesson);
lessons.push(collectionsLesson);

lessons.push(multiFileLesson);

lessons.push(worldCoordinatesLesson);
artifacts.L43=worldCoordinateArtifact;

lessons.push(repeatableLesson);
artifacts.L44=repeatableArtifact;
lessons.push(collisionLesson);
artifacts.L45=collisionArtifact;
lessons.push(uncertaintyLesson);
artifacts.L46=uncertaintyArtifact;
lessons.push(challengeTestLesson);
artifacts.L47=challengeTestArtifact;
lessons.push(investigationLesson);
artifacts.L48=investigationArtifact;
lessons.push(requirementMatrixLesson);

lessons.push(buildErrorsLesson);

lessons.push(communicationLesson);

lessons.push(substitutionLesson);


lessons.push(sharingLesson);

lessons.push(responsibleAiLesson);

lessons.push(capstoneProposalLesson);

lessons.push(integratedPrototypeLesson);

artifacts.L56=integratedPrototypeArtifact;

lessons.push(reliabilityReviewLesson);
artifacts.L57=reliabilityReviewArtifact;

lessons.push(performanceImprovementLesson);
artifacts.L58=performanceImprovementArtifact;

lessons.push(documentationLesson);
lessons.push(finalDemonstrationLesson);
