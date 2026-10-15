export type MotivationLocale='en'|'ru'|'kk';
type Text=Record<MotivationLocale,string>;
export interface LaunchMotivation {id:string;text:Text;author:string;source?:string;original?:string}
/** Short verified excerpts; translations are editorial, never attributed as the author's original wording. */
export const launchMotivations:readonly LaunchMotivation[]=[
 {id:'berners-lee-everyone',author:'Tim Berners-Lee',original:'This is for everyone.',source:'https://www.w3.org/news/2012/this-is-for-everyone-the-tweet-heard-around-the-world/',text:{en:'This is for everyone.',ru:'Это для каждого.',kk:'Бұл баршаға арналған.'}},
 {id:'pattis-mistakes',author:'Richard Pattis',original:'Mistakes lead to failure only if you don’t learn from them.',source:'https://www.cs.cmu.edu/~pattis/quotations.html',text:{en:'Mistakes lead to failure only if you don’t learn from them.',ru:'Ошибки приводят к неудаче, только если ты на них не учишься.',kk:'Қателерден сабақ алмасаң ғана олар сәтсіздікке әкеледі.'}},
 {id:'rus-build',author:'Daniela Rus',original:'At CSAIL, we do more than imagine that world. We work to build it.',source:'https://danielarus-r1.csail.mit.edu/wp-content/uploads/2017/10/2017-09-30-DirectorsVision.pdf',text:{en:'At CSAIL, we do more than imagine that world. We work to build it.',ru:'В CSAIL мы не просто представляем такой мир. Мы работаем над его созданием.',kk:'CSAIL-де біз мұндай әлемді жай елестетіп қана қоймаймыз. Оны құру үшін жұмыс істейміз.'}},
 {id:'johnson-questions',author:'Katherine Johnson',original:'I asked questions; I wanted to know why.',source:'https://www.nasa.gov/learning-resources/katherine-johnson-a-lifetime-of-stem/',text:{en:'I asked questions; I wanted to know why.',ru:'Я задавала вопросы; я хотела знать почему.',kk:'Мен сұрақтар қойдым; себебін білгім келді.'}},
 {id:'musk-design',author:'Elon Musk',original:'But I think it is important to combine aesthetic design with functionality.',source:'https://ecorner.stanford.edu/wp-content/uploads/sites/2/2015/10/3627.pdf',text:{en:'But I think it is important to combine aesthetic design with functionality.',ru:'Но я считаю, что важно сочетать эстетичный дизайн с функциональностью.',kk:'Бірақ эстетикалық дизайнды функционалдықпен үйлестіру маңызды деп ойлаймын.'}},
 {id:'feynman-create',author:'Richard Feynman',original:'What I cannot create, I do not understand.',source:'https://magazine.caltech.edu/post/biology-through-the-eyes-of-a-physicist',text:{en:'What I cannot create, I do not understand.',ru:'То, что я не могу создать, я не понимаю.',kk:'Өзім жасай алмайтын нәрсені мен түсінбеймін.'}},
 {id:'jobs-love',author:'Steve Jobs',original:'The only way to do great work is to love what you do.',source:'https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says',text:{en:'The only way to do great work is to love what you do.',ru:'Единственный способ делать великую работу — любить то, что делаешь.',kk:'Ұлы іс атқарудың жалғыз жолы — өз ісіңді жақсы көру.'}},
 {id:'altman-curiosity',author:'Sam Altman',original:'Follow your curiosity.',source:'https://blog.samaltman.com/how-to-be-successful',text:{en:'Follow your curiosity.',ru:'Следуй своему любопытству.',kk:'Қызығушылығыңның соңынан ер.'}},
 {id:'perlis-simplicity',author:'Alan Perlis',original:'Simplicity does not precede complexity, but follows it.',source:'https://www.cs.yale.edu/homes/perlis-alan/quotes.html',text:{en:'Simplicity does not precede complexity, but follows it.',ru:'Простота не предшествует сложности, а следует за ней.',kk:'Қарапайымдылық күрделіліктен бұрын емес, одан кейін келеді.'}},
 ...[
  ['One small experiment can begin a big idea.','Один маленький опыт может стать началом большой идеи.','Бір шағын тәжірибе үлкен идеяның бастауы болуы мүмкін.'],
  ['You do not need to know everything to begin.','Не обязательно знать всё, чтобы начать.','Бастау үшін бәрін білу міндетті емес.'],
  ['Change one thing. Observe. Discover why.','Измени одну деталь. Понаблюдай. Найди причину.','Бір бөлшекті өзгерт. Бақыла. Себебін тап.'],
  ['A mistake is a clue for your next attempt.','Ошибка — подсказка для следующей попытки.','Қате — келесі әрекетке арналған кеңес.'],
  ['Your first robot starts with your first question.','Твой первый робот начинается с первого вопроса.','Алғашқы роботың алғашқы сұрағыңнан басталады.'],
  ['Understanding one line is progress.','Понять одну строку — уже шаг вперёд.','Бір жолды түсіну — алға басқан қадам.'],
  ['A working prototype was once an uncertain idea.','Работающий прототип когда-то был лишь смелой догадкой.','Жұмыс істейтін прототип бір кезде батыл болжам болған.'],
  ['Make something that helps someone.','Создай что-нибудь, что поможет другому человеку.','Біреуге көмектесетін нәрсе жаса.'],
  ['A good question can change your whole design.','Хороший вопрос может изменить всю конструкцию.','Жақсы сұрақ бүкіл құрылымды өзгерте алады.'],
  ['Compare your result with your prediction. That is discovery.','Сравни результат с прогнозом. Так рождается открытие.','Нәтижеңді болжамыңмен салыстыр. Жаңалық осылай ашылады.'],
  ['You can learn at your own pace and still go far.','Можно учиться в своём темпе и далеко продвинуться.','Өз қарқыныңмен үйреніп те алысқа баруға болады.'],
  ['A clear explanation is also an engineering achievement.','Понятное объяснение — тоже инженерное достижение.','Түсінікті түсіндіру де — инженерлік жетістік.'],
  ['Build a small version of your big idea.','Собери маленькую версию своей большой идеи.','Үлкен идеяңның шағын нұсқасын құрастыр.'],
  ['Debugging begins with noticing, not guessing.','Отладка начинается с наблюдения, а не с угадывания.','Жөндеу болжаудан емес, бақылаудан басталады.'],
  ['Save your experiment. Tomorrow you can build on it.','Сохрани свой опыт. Завтра сможешь развить его.','Тәжірибеңді сақта. Ертең оны дамыта аласың.'],
  ['A sensor gives numbers. You give them meaning.','Датчик даёт числа. Ты находишь в них смысл.','Датчик сандар береді. Оларға мағынаны сен бересің.'],
  ['The best next step is one you can test.','Лучший следующий шаг — тот, который можно проверить.','Ең жақсы келесі қадам — тексеруге болатын қадам.'],
  ['Ask what would happen if you changed the rule.','Спроси себя: что будет, если изменить правило?','Ережені өзгертсең не болатынын өзіңнен сұра.'],
  ['Every careful test makes your idea more reliable.','Каждая внимательная проверка делает твою идею надёжнее.','Әр мұқият тексеріс идеяңды сенімдірек етеді.'],
  ['Your curiosity belongs in the workshop.','Твоему любопытству есть место в мастерской.','Шеберханада сенің қызығушылығыңа орын бар.'],
  ['You are allowed to begin again with a better idea.','Ты можешь начать заново с идеей получше.','Жақсырақ идеямен қайта бастауға болады.'],
  ['A robot that turns correctly is a reason to be proud.','Робот, который повернул как надо, — повод гордиться собой.','Дұрыс бұрылған робот — өзіңді мақтан тұтуға себеп.'],
  ['Let your imagination propose. Let your experiment decide.','Пусть воображение предложит, а эксперимент проверит.','Қиялың ұсынсын, тәжірибең тексерсін.'],
  ['A difficult task becomes clearer when you divide it.','Сложная задача становится понятнее, если разделить её на части.','Күрделі тапсырманы бөліктерге бөлсең, ол түсініктірек болады.'],
  ['The question you ask today may become tomorrow’s invention.','Сегодняшний вопрос может стать завтрашним изобретением.','Бүгінгі сұрақ ертеңгі өнертабысқа айналуы мүмкін.'],
  ['Show someone how your idea works. You may understand it better too.','Покажи кому-нибудь, как работает твоя идея. Сам тоже поймёшь её лучше.','Идеяңның қалай жұмыс істейтінін біреуге көрсет. Өзің де жақсырақ түсінуің мүмкін.'],
  ['The first version teaches you what the next version needs.','Первая версия подскажет, чего не хватает следующей.','Бірінші нұсқа келесі нұсқаға не қажет екенін көрсетеді.'],
  ['Your observations matter, even when the result surprises you.','Твои наблюдения важны, даже если результат оказался неожиданным.','Нәтиже күтпегендей болса да, бақылауларың маңызды.'],
  ['A neat connection and a clear name make room for bigger ideas.','Аккуратное соединение и понятное имя освобождают место большим идеям.','Ұқыпты қосылыс пен түсінікті атау үлкен идеяларға жол ашады.'],
  ['Wondering how something works is already a beginning.','Интересоваться, как что-то устроено, — уже начало.','Бір нәрсенің қалай жұмыс істейтінін білуге ұмтылу — бастама.'],
  ['Small steps are how real machines get built.','Настоящие машины создают маленькими шагами.','Нақты машиналар шағын қадамдармен жасалады.'],
  ['You can be both careful and inventive.','Можно быть и осторожным, и изобретательным.','Сақ та, өнертапқыш та болуға болады.'],
  ['When you find the cause, you gain more than a working program.','Найдя причину, ты получаешь больше, чем работающую программу.','Себебін тапқанда, жұмыс істейтін бағдарламадан да көп нәрсе үйренесің.'],
  ['A pause can help you see the solution differently.','Пауза помогает посмотреть на решение по-новому.','Үзіліс шешімге жаңаша қарауға көмектеседі.'],
  ['You have something no example project has: your own idea.','У тебя есть то, чего нет в примере: собственная идея.','Сенде дайын үлгіде жоқ нәрсе бар: өз идеяң.'],
  ['Try a simpler experiment before abandoning a big idea.','Прежде чем отказаться от большой идеи, попробуй опыт попроще.','Үлкен идеядан бас тартпас бұрын қарапайым тәжірибе жасап көр.'],
  ['A program becomes yours when you understand your changes.','Программа становится твоей, когда ты понимаешь свои изменения.','Өзгерістеріңді түсінгенде бағдарлама өзіңдікі болады.'],
  ['Measure twice. Discover something new once.','Измерь ещё раз. Возможно, заметишь что-то новое.','Қайта өлшеп көр. Жаңа нәрсе байқауың мүмкін.'],
  ['Progress can be quiet: a clearer question, a better test.','Прогресс бывает тихим: точнее вопрос, лучше проверка.','Ілгерілеу байқалмауы мүмкін: сұрақ анығырақ, тексеріс жақсырақ.'],
  ['A reliable robot needs your patience as much as your ideas.','Надёжному роботу нужны и твои идеи, и твоё терпение.','Сенімді роботқа идеяларың да, шыдамдылығың да қажет.'],
  ['You do not have to be the fastest to create something useful.','Чтобы создать полезную вещь, не обязательно быть самым быстрым.','Пайдалы нәрсе жасау үшін ең жылдам болу міндетті емес.'],
  ['A surprising number can be the start of a discovery.','Неожиданное число может стать началом открытия.','Күтпеген сан жаңалықтың бастауы болуы мүмкін.'],
  ['Your next experiment does not need to be perfect to teach you.','Следующий опыт не обязан быть идеальным, чтобы чему-то научить.','Бірдеңе үйрену үшін келесі тәжірибең мінсіз болуы міндетті емес.'],
  ['Good tools help. Your questions give them direction.','Хорошие инструменты помогают. Твои вопросы задают им направление.','Жақсы құралдар көмектеседі. Оларға бағытты сенің сұрақтарың береді.'],
  ['There is room in engineering for your way of thinking.','В инженерии есть место твоему способу мыслить.','Инженерияда сенің ойлау тәсіліңе де орын бар.'],
  ['Start with what you can observe, then explore what you cannot see yet.','Начни с того, что можно наблюдать, и исследуй то, чего пока не видно.','Бақылай алатын нәрседен бастап, әзірге көрінбейтінін зертте.'],
  ['A useful invention often begins with noticing an everyday problem.','Полезное изобретение часто начинается с обычной замеченной проблемы.','Пайдалы өнертабыс көбіне күнделікті мәселені байқаудан басталады.'],
  ['Draw the idea. Build a little. Learn a lot.','Нарисуй идею. Собери немного. Узнай многое.','Идеяңды сыз. Аздап құрастыр. Көп нәрсе үйрен.'],
  ['Another attempt can use everything the first one taught you.','В новой попытке пригодится всё, чему научила первая.','Алғашқы әрекеттен үйренгеннің бәрі келесі әрекетке пайдалы.'],
  ['The workshop is a place to explore, not to know every answer.','В мастерскую приходят исследовать, а не знать все ответы заранее.','Шеберханаға барлық жауапты біліп емес, зерттеу үшін келеді.']
 ].map(([en,ru,kk],index)=>({id:`jective-${index+1}`,author:'JECTIVE',text:{en:en!,ru:ru!,kk:kk!}}))
];
/** Avoid the previous item without keeping a student identity or contacting a server. */
export function selectLaunchMotivation(previous:string|null,random:number):LaunchMotivation{
 const choices=launchMotivations.filter(item=>item.id!==previous);
 const normalized=Number.isFinite(random)?Math.min(Math.max(random,0),1-Number.EPSILON):0;
 return choices[Math.floor(normalized*choices.length)]!;
}
