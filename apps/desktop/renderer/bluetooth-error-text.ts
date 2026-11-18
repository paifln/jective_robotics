import type {Locale} from './locale';
import {words} from './StudentUI';

export type BluetoothAction = 'connect'|'send'|'stop'|'disconnect'|'connection';

export function bluetoothErrorText(locale:Locale,action:BluetoothAction,detail=''):string{
 const w=(en:string,ru:string,kk:string)=>words(locale,en,ru,kk);
 if(action==='stop'||/STOP_UNCONFIRMED|RECONNECT_REQUIRED/.test(detail))
  return w('The robot may still be moving, so turn it off.','Выключи робота: он может ещё двигаться.','Робот әлі қозғалуы мүмкін, сондықтан оны өшір.');
 if(/FIRMWARE|HANDSHAKE|HELLO/.test(detail))
  return w('The robot did not answer, so check that it is on and set up for this mode.','Робот не отвечает — проверь, что он включён и настроен для этого режима.','Робот жауап бермеді, оның қосылғанын және осы режимге бапталғанын тексер.');
 if(/PORT_BUSY|PORT_OWNED|DEVICE_BUSY/.test(detail))
  return w('The robot is busy, so close any other program using it and try again.','Робот занят — закрой другую программу, которая к нему подключена, и попробуй снова.','Робот бос емес, оған қосылған басқа бағдарламаны жауып, қайталап көр.');
 if(/EXPIRED|LEASE|PORT_CLOSED/.test(detail)||action==='connection')
  return w('The robot disconnected, so reconnect to continue.','Связь с роботом потеряна — подключись снова.','Роботпен байланыс үзілді, жалғастыру үшін қайта қосыл.');
 if(action==='disconnect')
  return w('Could not disconnect the robot, so turn it off.','Не удалось отключиться от робота — выключи его.','Роботпен байланысты үзу мүмкін болмады, оны өшір.');
 if(action==='send')
  return w('Could not send the program to the robot.','Не удалось отправить программу роботу.','Бағдарламаны роботқа жіберу мүмкін болмады.');
 return w('Could not connect to the robot, so check that it is on.','Не удалось подключиться к роботу — проверь, что он включён.','Роботқа қосылу мүмкін болмады, оның қосылғанын тексер.');
}
