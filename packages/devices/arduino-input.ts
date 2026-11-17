import type {ArduinoCommand} from '../contracts/arduino-robot';

export const arduinoKeys:Readonly<Record<string,ArduinoCommand>>={ArrowUp:'F',ArrowDown:'B',ArrowLeft:'L',ArrowRight:'R',w:'F',s:'B',a:'L',d:'R'};

/** Emergency stop remains latched until every held input has been released. */
export class ArduinoInput {
 private keys=new Map<string,ArduinoCommand>();
 private pointers=new Map<number,ArduinoCommand>();
 private locked=false;
 keyDown(key:string,repeat=false){const command=arduinoKeys[key];if(command&&(!repeat||this.keys.has(key)))this.keys.set(key,command);}
 keyUp(key:string){this.keys.delete(key);this.unlock();}
 pointerDown(id:number,command:ArduinoCommand){this.pointers.set(id,command);}
 pointerUp(id:number){this.pointers.delete(id);this.unlock();}
 stop(){this.locked=true;this.unlock();}
 clear(){this.keys.clear();this.pointers.clear();this.locked=false;}
 private unlock(){if(!this.keys.size&&!this.pointers.size)this.locked=false;}
 get command():ArduinoCommand{
  if(this.locked)return 'S';
  const commands=new Set([...this.keys.values(),...this.pointers.values()]);
  return commands.size===1?[...commands][0]!:'S';
 }
}
