import {existsSync} from 'node:fs';
import {spawn,type ChildProcess} from 'node:child_process';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {StringDecoder} from 'node:string_decoder';
import {setTimeout as delay} from 'node:timers/promises';
import {RobotSimulation,type RobotState} from '../../../packages/simulator';
import {unoPythonModule,type PythonRequest} from '../../../packages/robots/python-runtime';
import {PythonRobotCommandSchema,pythonSimulationMachine,pythonSimulationModule,type PythonSimulationRequest} from '../../../packages/robots/python-simulation';

export class PythonRuntime {
 constructor(private readonly bundleDirectory?:string){}

 private child:ChildProcess|null=null;
 private active=false;
 private interrupted=false;
 private acceptsInput=false;

 input(line:string){
  const input=this.child?.stdin;
  if(!this.acceptsInput||!input?.writable||input.writableNeedDrain)return false;
  input.write(line+'\n');
  return true;
 }
 stop(){
  if(!this.active)return false;
  this.interrupted=true;
  const child=this.child;
  if(child?.pid&&process.platform==='win32'){
   const killer=spawn('taskkill.exe',['/pid',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});
   killer.on('error',()=>child.kill());
  }else child?.kill();
  return true;
 }

 async run(request:PythonRequest, output:(log:string)=>void, simulation?:{
  world:PythonSimulationRequest['world']; publish:(state:RobotState)=>void;
 }){
  if(this.active)throw new Error('PYTHON_BUSY');
  const {target,action,files,port}=request;
  const manageBoard=action==='install'||action==='probe'||action==='stop-board';
  if(!manageBoard&&!Object.hasOwn(files,'main.py'))throw new Error('PYTHON_MAIN_REQUIRED');
  if((target==='esp32'&&action!=='check'||action==='deploy')&&!port)throw new Error('PYTHON_PORT_REQUIRED');
  if(target==='uno'&&(action==='deploy'||manageBoard))throw new Error('PYTHON_ACTION_UNSUPPORTED');
  this.active=true;
  this.interrupted=false;
  let folder:string|undefined;
  let log='';
  let outputTimer:ReturnType<typeof setTimeout>|undefined;
  const append=(text:string)=>{
   if(!text)return;
   log=(log+text).slice(-65536);
   outputTimer??=setTimeout(()=>{
    outputTimer=undefined;
    output(log);
   },60);
  };
  try{
   folder=await mkdtemp(join(tmpdir(),'jective-python-'));
   for(const [name,source] of Object.entries(manageBoard?{}:files)){
    if(['jective_robot.py','_jective_start.py'].includes(name.toLowerCase()))throw new Error('PYTHON_RESERVED_FILE');
    await writeFile(join(folder,name),source,{flag:'wx'});
   }
   if(target==='uno')await writeFile(join(folder,'jective_robot.py'),simulation?pythonSimulationModule:unoPythonModule,{flag:'wx'});
   if(this.interrupted)return {state:'interrupted' as const,log};
   const execute=(args:string[],timeout?:number)=>this.execute(args,folder!,port,append,timeout);
   const script=(filename:string)=>['-u','-c',
    `import os, runpy, sys; sys.path.insert(0, os.getcwd()); runpy.run_path('${filename}', run_name='__main__')`];
   let exitCode:number|null;
   if(simulation){
    const robot=new RobotSimulation({setup:[],loop:[]},simulation.world,true);
    simulation.publish(robot.state);
    if(!Object.keys(files).some(name=>name.toLowerCase()==='machine.py')){
     await writeFile(join(folder,'machine.py'),pythonSimulationMachine,{flag:'wx'});
    }
    await writeFile(join(folder,'_jective_start.py'),
     "import runpy\nimport jective_robot\nrunpy.run_path('main.py', run_name='__main__')\n",{flag:'wx'});
    if(this.interrupted)return {state:'interrupted' as const,log};
    exitCode=await this.execute(script('_jective_start.py'),folder,undefined,append,150000,async (line,isLive)=>{
     const command=PythonRobotCommandSchema.parse(JSON.parse(line));
     if(command.kind==='sensor')return robot.readInteractive(command.sensor);
     if(command.kind!=='wait'){
      robot.driveInteractive(command);
      simulation.publish(robot.state);
      return null;
     }
     const ticks=Math.ceil(command.ms/20);
     for(let index=0;index<ticks&&!this.interrupted&&isLive();index++){
      const state=robot.step();
      if(state.status==='error')throw new Error(state.error??'SIMULATION_FAILED');
      if(index%2===0||index===ticks-1)simulation.publish(state);
      await delay(20);
     }
     return null;
    });
    const status=this.interrupted?'cancelled':exitCode===0?'completed':'error';
    simulation.publish(robot.finishInteractive(status,status==='error'?log:null));
   }else if(action==='check'){
    exitCode=await execute(['-I','-m','py_compile',...Object.keys(files)],30000);
   }else if(target==='uno'){
    this.acceptsInput=true;
    exitCode=await execute(script('main.py'));
   }else{
    const remote=['-E','-P','-m','mpremote','connect',port!];
    const identify="import sys; assert sys.platform == 'esp32' and sys.implementation.name == 'micropython', 'Expected an ESP32 running MicroPython'";
    if(action==='install'){
     const firmware=this.bundleDirectory&&join(this.bundleDirectory,'ESP32_GENERIC.bin');
     if(!firmware||!existsSync(firmware))throw new Error('MICROPYTHON_BUNDLE_MISSING');
     const flasher=['-I','-m','esptool','--chip','esp32','--port',port!];
     exitCode=await execute([...flasher,'flash-id'],45000);
     if(exitCode===0&&!this.interrupted){
      const size=log.match(/Detected flash size:\s*(\d+)\s*MB/i);
      if(!size||Number(size[1])<4){
       append('\nThis board needs at least 4 MB of flash for the included firmware.\n');
       exitCode=1;
      }else{
       exitCode=await execute([...flasher,'write-flash','--erase-all','--flash-size','detect','0x1000',firmware],150000);
       if(exitCode===0&&!this.interrupted){
        await delay(1200);
        if(!this.interrupted)exitCode=await execute([...remote,'exec',identify+"; print(sys.version)"],30000);
       }
      }
     }
    }else if(action==='probe'||action==='stop-board'){
     const command=action==='probe'?identify+"; print(sys.version)":identify;
     exitCode=await execute([...remote,'exec',command],30000);
    }else{
     const modules=Object.keys(files).filter(name=>name!=='main.py');
     if(action==='run'){
      const commands=modules.flatMap(name=>['fs','cp',name,':'+name,'+']);
      exitCode=await execute([...remote,'exec',identify,...commands,'run','main.py']);
      if(this.interrupted){
       // Closing mpremote alone leaves user code running on the board.
       const stopped=await execute([...remote,'exec',identify],30000);
       if(stopped!==0)append('\nESP32 interrupt could not be confirmed.\n');
      }
     }else{
      const staged=[...modules,'main.py'].map(name=>({name,temp:'/__jective_'+name+'.tmp'}));
      const commands=staged.flatMap(({name,temp})=>['fs','cp',name,':'+temp,'+']);
      const publish=['import os',
       ...staged.map(({name,temp})=>`compile(open('${temp}').read(), '${name}', 'exec')`),
       ...staged.map(({name,temp})=>`os.rename('${temp}', '/${name}')`),
      ].join('; ');
      exitCode=await execute([...remote,'exec',identify,...commands,'exec',publish],120000);
      if(exitCode===0&&!this.interrupted){
       exitCode=await execute([...remote,'reset'],30000);
      }
     }
    }
   }
   return {state:this.interrupted?'interrupted' as const:exitCode===0?'succeeded' as const:'failed' as const,log};
  }finally{
   clearTimeout(outputTimer);
   this.acceptsInput=false;
   try{
    if(folder)await rm(folder,{recursive:true,force:true,maxRetries:4,retryDelay:100});
   }finally{
    this.active=false;
   }
  }
 }

 private execute(args:string[],folder:string,port:string|undefined,append:(text:string)=>void,timeout?:number,
  command?:(line:string,isLive:()=>boolean)=>Promise<number|null>){
  const embedded=this.bundleDirectory&&join(this.bundleDirectory,'python.exe');
  const bundled=embedded&&existsSync(embedded)?embedded:undefined;
  const launcher=bundled??(process.platform==='win32'?'py.exe':'python3');
  const prefix=!bundled&&process.platform==='win32'?['-3']:[];
  return new Promise<number|null>((resolve,reject)=>{
   const child=spawn(launcher,[...prefix,'-X','utf8',...args],{
    cwd:folder,windowsHide:true,stdio:['pipe','pipe','pipe'],
    env:{...process.env,PYTHONIOENCODING:'utf-8',JECTIVE_ROBOT_PORT:port??''},
   });
   this.child=child;
   let live=true;
   child.stdin.on('error',()=>{});
   if(!this.acceptsInput&&!command)child.stdin.end();
   const timer=timeout?setTimeout(()=>this.stop(),timeout):undefined;
   for(const stream of [child.stdout,child.stderr]){
    const decoder=new StringDecoder('utf8');
    if(command&&stream===child.stdout){
     let pending='';
     let working=false;
     stream.on('data',(chunk:Buffer)=>{
      pending+=decoder.write(chunk);
      if(pending.length>4096||working){append('Invalid simulation command stream.');this.stop();return;}
      const newline=pending.indexOf('\n');
      if(newline<0)return;
      const line=pending.slice(0,newline);
      pending=pending.slice(newline+1);
      working=true;
      void command(line,()=>live).then(value=>({value}),error=>({error:String(error)})).then(response=>{
       working=false;
       if(live&&!this.interrupted&&child.stdin.writable)child.stdin.write(JSON.stringify(response)+'\n');
      });
     });
     continue;
    }
    stream.on('data',(chunk:Buffer)=>append(decoder.write(chunk)));
    stream.on('end',()=>append(decoder.end()));
   }
   child.once('error',error=>{
    live=false;
    clearTimeout(timer);
    this.child=null;
    reject(new Error('PYTHON_LAUNCH_FAILED: '+error.message));
   });
   child.once('close',code=>{
    live=false;
    clearTimeout(timer);
    this.child=null;
    resolve(code);
   });
  });
 }
}
