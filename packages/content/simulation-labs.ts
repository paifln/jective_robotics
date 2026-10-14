import type {Program} from '../codegen';
import {worlds} from '../simulator';
const text=(en:string,ru:string,kk:string)=>({en,ru,kk});
export const worldNames:Record<string,ReturnType<typeof text>>={
 'open-test-area':text('Free driving','Свободное движение','Еркін жүру'),
 'straight-line':text('Straight line','Прямая линия','Түзу сызық'),
 'curved-line-junction':text('Turns and junctions','Повороты и развилки','Бұрылыстар мен қиылыстар'),
 'obstacle-course':text('Obstacles','Препятствия','Кедергілер'),
 slalom:text('Slalom','Слалом','Слалом'),
 parking:text('Parking','Парковка','Тұрақ'),
 'square-track':text('Square track','Квадратная трасса','Шаршы жол'),
 'narrow-passage':text('Narrow passage','Узкий проход','Тар өткел'),
 warehouse:text('Warehouse','Склад','Қойма'),
 'sensor-bend':text('Turn before a wall','Поворот перед стеной','Қабырға алдында бұрылу'),
 maze:text('Maze','Лабиринт','Лабиринт'),
 'delivery-challenge':text('Delivery route','Доставка груза','Жүк жеткізу'),
 courtyard:text('Around the courtyard','Объезд двора','Ауланы айналып өту'),
 switchback:text('Alternating gates','Чередующиеся ворота','Кезектескен қақпалар'),
 's-bend':text('S-shaped road','S-образная дорога','S тәрізді жол'),
 'loading-bay':text('Loading bay','Погрузочный карман','Жүк тиеу орны'),
};
export const simulationLabs:{id:string;title:ReturnType<typeof text>;task:ReturnType<typeof text>;program:Program;world:typeof worlds[number]}[]=[
 {id:'drive',title:text('Drive and stop','Поехать и остановиться','Жүріп, тоқтау'),task:text('Watch the robot drive forward for 2 seconds and stop. Then open its blocks and change the wait to 1 second. How does the distance change?','Посмотри, как робот едет 2 секунды и останавливается. Затем открой его блоки и измени ожидание на 1 секунду. Как изменится путь?','Роботтың 2 секунд жүріп, тоқтауын бақыла. Блоктарын ашып, күтуді 1 секундқа өзгерт. Жол қалай өзгереді?'),world:worlds[0]!,program:{setup:[{kind:'drive',left:40,right:40},{kind:'wait',ms:2000},{kind:'stop'},{kind:'wait',ms:300}],loop:[]}},
 {id:'turn',title:text('Turn on the spot','Повернуть на месте','Орнында бұрылу'),task:text('The wheels turn in opposite directions. Compare the heading before and after the turn. Change the wait to make a shorter turn.','Колёса вращаются в разные стороны. Сравни направление до и после поворота. Уменьши ожидание, чтобы поворот стал короче.','Дөңгелектер қарама-қарсы айналады. Бұрылуға дейінгі және кейінгі бағытты салыстыр. Күтуді азайтып, қысқа бұрылыс жаса.'),world:worlds[0]!,program:{setup:[{kind:'drive',left:-25,right:25},{kind:'wait',ms:1000},{kind:'stop'},{kind:'wait',ms:300}],loop:[]}},
 {id:'distance',title:text('Stop before a wall','Остановиться перед стеной','Қабырға алдында тоқтау'),task:text('A distance check repeats while the robot approaches a wall. When the distance is 0.4 m or less, it stops. Missing readings also stop it.','Робот снова и снова проверяет расстояние до стены. При 0,4 м или меньше он останавливается. Если измерение пропало, он тоже остановится.','Робот қабырға қашықтығын қайта тексереді. 0,4 м не аз болса, тоқтайды. Өлшем жоғалса да тоқтайды.'),world:{...structuredClone(worlds[0]!),id:'student-wall',obstacles:[{x:1.8,y:1,width:.25,height:1}]},program:{setup:[],loop:[{kind:'if',condition:{kind:'binary',op:'&&',left:{kind:'sensor',sensor:'distanceValid'},right:{kind:'binary',op:'>',left:{kind:'sensor',sensor:'distance'},right:{kind:'number',value:.4}}},then:[{kind:'drive',left:30,right:30}],otherwise:[{kind:'stop'}]},{kind:'wait',ms:100}]}},
 {id:'blink',title:text('Blink an indicator','Мигать индикатором','Индикаторды жыпылықтату'),task:text('The robot stays still. Watch the indicator switch on and off every half second. Open the blocks to change the rhythm.','Робот стоит на месте. Индикатор включается и выключается каждые полсекунды. Открой блоки и измени ритм.','Робот орнында тұрады. Индикатор әр жарты секундта қосылып-өшеді. Блоктарды ашып, ырғағын өзгерт.'),world:worlds[0]!,program:{setup:[],loop:[{kind:'led',on:true},{kind:'wait',ms:500},{kind:'led',on:false},{kind:'wait',ms:500}]}},
];
