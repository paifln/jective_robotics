import {WirelessOpenSchema,WirelessRunSchema,WirelessSessionSchema} from '../../packages/contracts/arduino-wireless';
import {ArduinoOpenSchema,ArduinoCommandRequestSchema,ArduinoCloseSchema} from '../../packages/contracts/arduino-robot';
import {rendererRecovery} from './infrastructure/renderer-recovery';
import {takeAssistantProvisioning,type AssistantProvisioning} from './infrastructure/assistant-provisioning';
import {restoreWindowPlacement} from '../../packages/contracts/window-placement';
import {readWindowPlacement,trackWindowPlacement} from './infrastructure/window-placement';
import {controlWindow,windowState} from './infrastructure/window-controls';
import {ProjectListRequestSchema} from '../../packages/contracts/project-browser';
import {assessKnowledge} from '../../packages/content/assess-knowledge';
import {snapshotEnvironmentInThread} from './infrastructure/environment-thread';
import {isStudioMedia,studioMediaResponse} from './infrastructure/media';
import {exportArduinoProject} from '../../packages/persistence/arduino-export';
import {createProjectCopy} from '../../packages/contracts/project-copy';
import {ReviewArchiveSchema} from '../../packages/contracts/review';
import {verifyReviewArchive,verifyReviewAssignment} from '../../packages/review';
import {importReviewAssignment,importReviewWork,importReviewFeedback} from '../../packages/persistence/review';
import {reviewReport} from '../../packages/review/report';
import {app,BrowserWindow,ipcMain,dialog,protocol,net,session,nativeImage,shell,screen} from 'electron';
import {createCodeCopy} from '../../packages/codegen/conversion';
import {nativeText} from '../../packages/localization/native';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {PreferencesSchema,ProjectSchema,AssignmentSchema,SubmissionSchema,GradeSchema} from '../../packages/contracts';
import {z} from 'zod';
import {mkdir,writeFile,stat,rename,rm,realpath} from 'node:fs/promises';
import {verifyProjectProfile} from '../../packages/profiles/binding';
import {WorkspaceStore,inspectBackup,populateBackup} from '../../packages/persistence/workspace';
import {encodeArchive,decodeArchive,csvCell} from '../../packages/persistence/archives';
import {DeviceService} from '../../packages/devices';
import {ProfileRegistry} from '../../packages/profiles/registry';
import {encodeProfile} from '../../packages/profiles/exchange';
import {reviewProfileMigration} from '../../packages/profiles/migration';
import {readProjectSnapshot,projectFileFingerprint,writeProject} from '../../packages/persistence';
import {DocumentSession} from '../../packages/persistence/document-session';
import {readBoundedFile} from '../../packages/persistence/bounded-file';
import {MAX_PORTABLE_ARCHIVE} from '../../packages/persistence/portable-zip';
import {ToolchainService} from '../../packages/toolchain';
import {importBundle,inspectBundleManifest} from '../../packages/toolchain/bundle';
import {AssistantService} from '../../packages/assistant';
import {trustedStudioDocument,studioAsset,containedPath} from './infrastructure/security';
import {OperationLog,safeErrorCode} from './infrastructure/operation-log';
import {JournalPageRequestSchema} from '../../packages/contracts/compiler-journal';
protocol.registerSchemesAsPrivileged([{scheme:'jective',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
let pendingAssistantProvisioning:AssistantProvisioning|null=takeAssistantProvisioning(process.env);
let win:BrowserWindow;let service:ToolchainService;let store:WorkspaceStore;let operationLog:OperationLog;const devices=new DeviceService();const documents=new DocumentSession();let buildBusy=false;let projectBusy=false;
let activeOperations=0;let restoringWorkspace=false;
function clearCurrentDocument(){documents.clear();}
function currentLocale(){try{return store?.state().locale??'ru';}catch{return 'ru' as const;}}
function brandedMessage(options:Electron.MessageBoxOptions){const locale=currentLocale();return {...options,message:nativeText(options.message,locale),buttons:options.buttons?.map(label=>nativeText(label,locale)),title:options.title?'JECTIVE — '+nativeText(options.title,locale):'JECTIVE Robotics Studio',icon:nativeImage.createFromPath(join(__dirname,'renderer','jective-icon.png')).resize({width:64,height:64})};}
function resolveProject(value:unknown){const p=ProjectSchema.parse(value);const {profile,hash}=verifyProjectProfile(p);return {...p,profileVersion:profile.version,profileHash:hash};}
async function chooseExport(extension:string,name:string,bytes:Uint8Array|string){const selected=await dialog.showSaveDialog(win,{defaultPath:name+'.'+extension,filters:[{name:extension,extensions:[extension]}]});if(selected.canceled||!selected.filePath)return false;await writeFile(selected.filePath,bytes);return true;}
async function chooseArchive(){const selected=await dialog.showOpenDialog(win,{filters:[{name:'JECTIVE portable file',extensions:['jective']}],properties:['openFile']});if(selected.canceled||!selected.filePaths[0])return null;const path=selected.filePaths[0];return decodeArchive(await readBoundedFile(path,{maxBytes:MAX_PORTABLE_ARCHIVE,tooLarge:'ARCHIVE_TOO_LARGE',invalid:'ARCHIVE_UNSAFE',changed:'ARCHIVE_CHANGED'}));}
function handler(channel:string,fn:(value:unknown)=>Promise<unknown>){ipcMain.handle(channel,async(event,value:unknown)=>{
  if(event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame||!trustedStudioDocument(event.senderFrame.url)){operationLog?.record(channel,'IPC_DENIED');throw new Error('IPC_DENIED');}
  try{
   const restore=channel==='workspace:restore';
   if(restoringWorkspace||(restore&&activeOperations>0))throw new Error('WORKSPACE_BUSY');
   if(restore)restoringWorkspace=true;
   activeOperations++;
   try{return {ok:true,value:await fn(value)};}
   finally{activeOperations--;if(restore)restoringWorkspace=false;}
  }catch(e){operationLog?.record(channel,safeErrorCode(e));const message=e instanceof z.ZodError&&e.issues.some(issue=>issue.message==='PROJECT_WORKSPACE_UNSAFE')?'PROJECT_WORKSPACE_UNSAFE':e instanceof Error?e.message:'UNKNOWN';return {ok:false,error:{code:message.split(':')[0]??'UNKNOWN',message}};}
});}
app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
if(process.env.JECTIVE_WORKSPACE_ROOT)app.setPath('userData',resolve(process.env.JECTIVE_WORKSPACE_ROOT));
const primaryInstance=app.requestSingleInstanceLock();
if(!primaryInstance)app.quit();
else app.on('second-instance',()=>{if(win&&!win.isDestroyed()){if(win.isMinimized())win.restore();win.show();win.focus();}});
if(primaryInstance)app.whenReady().then(async()=>{
  await mkdir(app.getPath('userData'),{recursive:true});operationLog=new OperationLog(join(app.getPath('userData'),'logs','operations.jsonl'));operationLog.record('application','STARTED');store=new WorkspaceStore(join(app.getPath('userData'),'workspace.sqlite'));
  const assistant=new AssistantService(join(app.getPath('userData'),'assistant.json'),true);
  // Provision only a revocable learner credential, never the provider key.
  const provisioning=pendingAssistantProvisioning;pendingAssistantProvisioning=null;
  if(provisioning?.server&&provisioning.token){
    try{await assistant.configure({enabled:true,endpoint:provisioning.server,model:'jective-managed',apiKey:provisioning.token});}
    catch{operationLog.record('assistant','PROVISION_FAILED');}
  }else if(provisioning?.server||provisioning?.token)operationLog.record('assistant','PROVISION_INCOMPLETE');
  const profileRegistry=new ProfileRegistry(join(app.getPath('userData'),'board-profiles'));
  handler('learning:load',async value=>store.learning(value));
  handler('learning:save',async value=>store.saveLearning(value));
  handler('help:website',async value=>{z.undefined().parse(value);await shell.openExternal('https://www.jective.kz/');return true;});
  handler('profiles:list',async()=>profileRegistry.list());
  handler('profiles:review',async value=>{const selection=z.object({id:z.string().max(80),version:z.string().max(80),hash:z.string().regex(/^[a-f0-9]{64}$/)}).strict();const r=z.object({previous:selection,next:selection,componentId:z.string().max(80),wiring:z.record(z.string().max(80),z.number().int().min(0).max(48).nullable())}).strict().parse(value);return reviewProfileMigration(await profileRegistry.resolve(r.previous.id,r.previous.version,r.previous.hash),await profileRegistry.resolve(r.next.id,r.next.version,r.next.hash),r.componentId,r.wiring);});
  handler('profiles:import',async value=>profileRegistry.import(z.string().max(128*1024).parse(value)));
  handler('profiles:export',async value=>{const selection=z.object({id:z.string().max(80),version:z.string().max(80),hash:z.string().regex(/^[a-f0-9]{64}$/)}).strict().parse(value);return encodeProfile(await profileRegistry.resolve(selection.id,selection.version,selection.hash));});
  handler('assistant:settings',async()=>assistant.settings());handler('assistant:configure',async()=>{throw new Error('AI_ADMIN_CONFIGURATION_REQUIRED');});handler('assistant:ask',async value=>assistant.ask(value));handler('assistant:cancel',async()=>assistant.cancel());app.on('before-quit',()=>assistant.cancel());
  const root=join(__dirname,'renderer');
  protocol.handle('jective',async request=>{const target=studioAsset(root,request.url,request.method);if(!target)return new Response('Denied',{status:403});try{const actual=await realpath(target);if(!containedPath(root,actual))return new Response('Denied',{status:403});if(isStudioMedia(actual))return await studioMediaResponse(actual,request.headers.get('range'));return await net.fetch(pathToFileURL(actual).toString());}catch{return new Response('Not found',{status:404});}});
  session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  session.defaultSession.setPermissionCheckHandler(()=>false);
  session.defaultSession.setDevicePermissionHandler(()=>false);
  service=new ToolchainService(app.isPackaged?join(process.resourcesPath,'tools','arduino-cli.exe'):join(app.getAppPath(),'.toolchain','bin','arduino-cli.exe'),process.env.JECTIVE_TOOLCHAIN_ROOT??join(app.getPath('userData'),'toolchain'),(executable,root,coreVersion,cancelled,progress,core)=>snapshotEnvironmentInThread(executable,root,coreVersion,cancelled,undefined,undefined,progress,core),event=>{if(win&&!win.isDestroyed()&&!win.webContents.isDestroyed())win.webContents.send('build:stage',event);});
  const placementPath=join(app.getPath('userData'),'window-placement.json');
  const primaryDisplay=screen.getPrimaryDisplay();
  const placement=restoreWindowPlacement(await readWindowPlacement(placementPath),[primaryDisplay.workArea,...screen.getAllDisplays().filter(display=>display.id!==primaryDisplay.id).map(display=>display.workArea)]);
  win=new BrowserWindow({...placement.bounds,minWidth:placement.minWidth,minHeight:placement.minHeight,frame:false,autoHideMenuBar:true,show:false,backgroundColor:'#211dff',icon:join(__dirname,'renderer','jective-icon.png'),webPreferences:{preload:join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webviewTag:false,devTools:!app.isPackaged}});
  win.setMenu(null);
  const stopArduino=()=>{void devices.stopRobot().catch(()=>undefined);void devices.stopWirelessActive().catch(()=>undefined);};
  win.on('blur',stopArduino);win.on('hide',stopArduino);win.on('minimize',stopArduino);win.on('close',stopArduino);win.webContents.on('render-process-gone',stopArduino);win.webContents.on('did-start-loading',stopArduino);
  trackWindowPlacement(win,placementPath,()=>operationLog.record('window','PLACEMENT_SAVE_FAILED'));
  handler('window:state',async()=>windowState(win));
  handler('window:action',async value=>controlWindow(win,value));
  const publishWindowState=()=>{if(!win.isDestroyed()&&!win.webContents.isDestroyed())win.webContents.send('window:stateChanged',windowState(win));};
  win.on('maximize',publishWindowState);win.on('unmaximize',publishWindowState);
  win.on('enter-full-screen',publishWindowState);win.on('leave-full-screen',publishWindowState);
  win.webContents.on('did-finish-load',publishWindowState);
  const publishWindowVisibility=()=>{if(!win.isDestroyed()&&!win.webContents.isDestroyed())win.webContents.send('window:visibility',win.isVisible()&&!win.isMinimized());};
  win.on('show',publishWindowVisibility);win.on('hide',publishWindowVisibility);win.on('minimize',publishWindowVisibility);win.on('restore',publishWindowVisibility);
  win.webContents.on('did-finish-load',publishWindowVisibility);
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.webContents.on('will-frame-navigate',e=>e.preventDefault());win.webContents.on('will-attach-webview',e=>e.preventDefault());
  const recoverRenderer=rendererRecovery(win,async()=>{
   const choice=await dialog.showMessageBox(win,brandedMessage({type:'warning',buttons:['Restart interface','Close'],defaultId:0,cancelId:1,title:'Interface interrupted',message:'The interface stopped. Restart it to try recovery from the last local autosave. More recent changes may need to be entered again.'}));
   return choice.response===0?'retry':'close';
  },code=>operationLog.record('renderer',code));
  win.webContents.on('render-process-gone',()=>{void recoverRenderer('PROCESS_GONE');});
  win.webContents.once('did-finish-load',()=>win.webContents.on('did-fail-load',(_event,errorCode,_description,_url,isMainFrame)=>{if(isMainFrame&&errorCode!==-3)void recoverRenderer('LOAD_FAILED');}));
  win.webContents.on('will-prevent-unload',event=>{const choice=dialog.showMessageBoxSync(win,brandedMessage({type:'question',buttons:['Keep editing','Discard unsaved changes and close'],defaultId:0,cancelId:0,title:'Unsaved project',message:'The project has unsaved changes.'}));if(choice===1)event.preventDefault();});
  handler('toolchain:status',async value=>{if(buildBusy)throw new Error('TOOLCHAIN_BUSY');const id=z.string().max(80).optional().parse(value);if(id)return service.status(id);const r=await service.run(['version']);if(r.code!==0)throw new Error('CLI_UNAVAILABLE: '+r.log);return r.log;});
  handler('toolchain:prepare',async value=>{const id=z.string().max(80).parse(value);if(buildBusy)throw new Error('TOOLCHAIN_BUSY');buildBusy=true;try{return await service.prepareCore(id);}finally{buildBusy=false;}});
  handler('toolchain:import',async()=>{
   if(buildBusy)throw new Error('TOOLCHAIN_BUSY');buildBusy=true;
   try{
    const selected=await dialog.showOpenDialog(win,{title:nativeText('Choose an extracted JECTIVE offline toolchain bundle',currentLocale()),properties:['openDirectory']});
    if(selected.canceled||!selected.filePaths[0])return false;
    const source=selected.filePaths[0],review=await inspectBundleManifest(source);
    const confirmed=await dialog.showMessageBox(win,brandedMessage({type:'warning',buttons:['Cancel','Install reviewed tools'],defaultId:0,cancelId:0,message:'Install these build tools? They can execute programs when compiling. Only continue if your administrator verified their source. A matching hash is not a publisher signature.',detail:'SHA-256: '+review.sha256+'\n'+new Intl.NumberFormat(currentLocale()).format(review.files)+' / '+new Intl.NumberFormat(currentLocale()).format(review.bytes)+' B'}));
    if(confirmed.response!==1)return false;
    await importBundle(source,service.root,{expectedManifestHash:review.sha256});await service.config();return true;
   }finally{buildBusy=false;}
  });
  handler('project:open',async()=>{if(projectBusy)throw new Error('PROJECT_BUSY');projectBusy=true;try{const selected=await dialog.showOpenDialog(win,{filters:[{name:'JECTIVE project',extensions:['json']}],properties:['openFile']});if(selected.canceled)return null;const path=selected.filePaths[0];if(!path) return null;const snapshot=await readProjectSnapshot(path),p=snapshot.project;return documents.prepare(p,{path,revision:p.revision,fingerprint:snapshot.fingerprint});}finally{projectBusy=false;}});
  handler('project:save',async value=>{if(projectBusy)throw new Error('PROJECT_BUSY');projectBusy=true;try{const requestedEpoch=documents.version;const p=resolveProject(value);const storedBefore=JSON.stringify(store.project(p.id));const binding=documents.binding;let target=binding?.path??null;let expected=binding?.revision??null,expectedFingerprint=binding?.fingerprint??null;if(!target){const selected=await dialog.showSaveDialog(win,{defaultPath:p.name+'.jective.json',filters:[{name:'JECTIVE project',extensions:['json']}]});if(selected.canceled||!selected.filePath)throw new Error('SAVE_CANCELLED');target=selected.filePath;expected=null;expectedFingerprint=null;}const saved=await writeProject(target,p,expected,expectedFingerprint);const stillCurrent=documents.adoptSaved({path:target,revision:saved.revision,fingerprint:projectFileFingerprint(JSON.stringify(saved,null,2))},requestedEpoch);store.completedSave(saved,stillCurrent,JSON.stringify(store.project(p.id))===storedBefore);return saved;}finally{projectBusy=false;}});
  handler('build:compile',async value=>{if(buildBusy)throw new Error('TOOLCHAIN_BUSY');buildBusy=true;try{return await service.compile(resolveProject(value));}finally{buildBusy=false;}});
  handler('build:journalPage',async value=>{const request=JournalPageRequestSchema.parse(value);return service.journalPage(request.operationId,request.offset);});
  handler('build:journalExport',async value=>{const id=z.uuid().parse(value);await service.journalPage(id,0);const selected=await dialog.showSaveDialog(win,{defaultPath:'jective-compiler-'+id+'.log',filters:[{name:'Log',extensions:['log']}]});if(selected.canceled||!selected.filePath)return false;await service.exportJournal(id,selected.filePath);return true;});
  handler('build:cancel',async()=>service.cancel());
  handler('project:new',async()=>{clearCurrentDocument();return true;});
  handler('project:duplicate',async value=>{if(projectBusy)throw new Error('PROJECT_BUSY');projectBusy=true;try{const original=resolveProject(value),copy=createProjectCopy(original,crypto.randomUUID());store.duplicate(original,copy);clearCurrentDocument();return copy;}finally{projectBusy=false;}});
  handler('project:convertCopy',async value=>{if(projectBusy)throw new Error('PROJECT_BUSY');projectBusy=true;try{const original=resolveProject(value),copy=createCodeCopy(original,crypto.randomUUID());store.conversion(original,copy);clearCurrentDocument();return copy;}finally{projectBusy=false;}});
  handler('workspace:project',async value=>store.project(z.uuid().parse(value)));handler('workspace:openProject',async value=>{const p=store.project(z.uuid().parse(value));return p?documents.prepare(p,null):null;});handler('workspace:delete',async value=>{const id=z.uuid().parse(value);const confirmed=await dialog.showMessageBox(win,brandedMessage({buttons:['Cancel','Delete local project and snapshots'],defaultId:0,cancelId:0,message:'Delete local recovery and snapshots for this project? Exported files are not removed.'}));if(confirmed.response!==1)return false;store.removeProject(id);return true;});handler('workspace:snapshots',async value=>store.snapshots(z.uuid().parse(value)));handler('workspace:snapshot',async value=>{const p=z.object({project:ProjectSchema,label:z.string().min(1).max(100)}).strict().parse(value);store.snapshot(resolveProject(p.project),p.label);return true;});handler('workspace:restoreSnapshot',async value=>{const p=store.restoreSnapshot(z.number().int().positive().parse(value));if(p)return documents.prepare({...p,id:crypto.randomUUID(),revision:0},null);return null;});
  handler('workspace:activity',async()=>store.activity().days);
  handler('workspace:activityBaseline',async value=>{store.activityBaseline(resolveProject(value));return true;});
  handler('workspace:projects',async value=>store.listProjects(ProjectListRequestSchema.parse(value)));
  handler('workspace:state',async()=>store.state());
  handler('workspace:preferences',async value=>{store.preferences(PreferencesSchema.parse(value));return true;});
  handler('workspace:autosave',async value=>{store.autosave(resolveProject(value));return true;});
  handler('learning:knowledge',async value=>{const assessment=assessKnowledge(value);if(assessment.result.passed)store.progress(assessment.lessonId,'knowledge-check-passed');return assessment.result;});
  handler('workspace:progress',async value=>{const p=z.object({lessonId:z.string().regex(/^L\d{2}$/),state:z.enum(['started','self-reported-complete','simulation-complete','teacher-reviewed'])}).strict().parse(value);store.reportProgress(p.lessonId,p.state);return true;});
  handler('project:export',async value=>{const p=resolveProject(value);return chooseExport('jective',p.name,encodeArchive('project',p));});
  handler('project:import',async()=>{if(projectBusy)throw new Error('PROJECT_BUSY');projectBusy=true;try{const archive=await chooseArchive();if(!archive)return null;if(archive.kind!=='project')throw new Error('ARCHIVE_KIND');return documents.prepare(archive.value,null,true);}finally{projectBusy=false;}});
  handler('project:acceptOpen',async value=>{return documents.accept(value,p=>store.autosave(resolveProject(p)));});
  handler('project:arduino',async value=>{const p=resolveProject(value);const selected=await dialog.showOpenDialog(win,{properties:['openDirectory','createDirectory']});if(selected.canceled||!selected.filePaths[0])return false;await exportArduinoProject(p,selected.filePaths[0]);return true;});
  handler('wireless:open',async value=>{const request=WirelessOpenSchema.parse(value);if(buildBusy)throw new Error('DEVICE_BUSY');return devices.openWireless(request.path);});
  handler('wireless:run',async value=>{const request=WirelessRunSchema.parse(value);if(buildBusy||win.isDestroyed()||!win.isFocused()||win.isMinimized()){await devices.stopWirelessActive();throw new Error('WIRELESS_CONTROL_INACTIVE');}return devices.runWireless(request);});
  handler('wireless:keepalive',async value=>{const request=WirelessSessionSchema.parse(value);if(win.isDestroyed()||!win.isFocused()||win.isMinimized())await devices.stopWirelessActive();return devices.keepaliveWireless(request.sessionId);});
  handler('wireless:stop',async value=>devices.stopWireless(WirelessSessionSchema.parse(value).sessionId));
  handler('wireless:close',async value=>devices.closeWireless(WirelessSessionSchema.parse(value).sessionId));
  handler('arduino:open',async value=>{const request=ArduinoOpenSchema.parse(value);if(buildBusy)throw new Error('DEVICE_BUSY');return devices.openRobot(request.path);});
  handler('arduino:command',async value=>{const request=ArduinoCommandRequestSchema.parse(value);if(request.command!=='S'&&(buildBusy||win.isDestroyed()||!win.isFocused()||win.isMinimized())){await devices.stopRobot();throw new Error('ROBOT_CONTROL_INACTIVE');}return devices.commandRobot(request);});
  handler('arduino:close',async value=>devices.closeRobot(ArduinoCloseSchema.parse(value).sessionId));
  handler('devices:list',async()=>devices.list());
  devices.subscribe(event=>{if(win&&!win.isDestroyed())win.webContents.send('serial:event',event);});
  handler('serial:open',async value=>{const p=z.object({path:z.string().max(100),baudRate:z.number().int()}).strict().parse(value);if(buildBusy)throw new Error('DEVICE_BUSY');return devices.open(p.path,p.baudRate);});
  handler('serial:close',async()=>devices.close());handler('serial:send',async value=>devices.send(z.string().max(4096).parse(value)));
  handler('device:upload',async value=>{
   if(buildBusy)throw new Error('DEVICE_BUSY');
   buildBusy=true;
   try{
    const p=z.object({project:ProjectSchema,operationId:z.uuid(),port:z.string().max(100),mode:z.literal('run').optional()}).strict().parse(value);
    const port=async()=>(await devices.list()).find(device=>device.path===p.port);
    const selected=await port();
    if(!selected||(p.mode==='run'&&selected.transport==='bluetooth'))throw new Error('PORT_NOT_FOUND');
    if(p.mode!=='run'){
     const confirmed=await dialog.showMessageBox(win,brandedMessage({type:'warning',buttons:['Cancel','Upload selected firmware'],defaultId:0,cancelId:0,message:'Upload to '+p.port+'? Verify the physical board model, wiring and power. Upload does not verify safe physical behavior.'}));
     if(confirmed.response!==1)throw new Error('UPLOAD_CANCELLED');
     if(!(await port()))throw new Error('PORT_NOT_FOUND');
    }
    await devices.close();
    return await service.upload(resolveProject(p.project),p.operationId,p.port);
   }finally{buildBusy=false;}
  });
  handler('review:open',async()=>{const selected=await chooseArchive();if(!selected)return null;return verifyReviewArchive(selected);});
  handler('review:accept',async value=>{const archive=ReviewArchiveSchema.parse(value);return archive.kind==='assignment'?importReviewAssignment(store,archive.value):archive.kind==='review-work'?importReviewWork(store,archive.value):importReviewFeedback(store,archive.value);});
  handler('review:report',async value=>{const format=z.enum(['csv','html']).parse(value);return chooseExport(format,'jective-review-report',reviewReport(store.classroom(),store.state().locale,format));});
  handler('review:starter',async value=>{if(projectBusy)throw new Error('PROJECT_BUSY');projectBusy=true;try{const assignment=verifyReviewAssignment(value);if(!assignment.starter)throw new Error('REVIEW_STARTER_MISSING');const original=resolveProject(assignment.starter),copy=createProjectCopy(original,crypto.randomUUID());copy.name=original.name.slice(0,90)+' · '+nativeText('Copy',store.state().locale);store.autosave(copy);clearCurrentDocument();return copy;}finally{projectBusy=false;}});
  handler('review:export',async value=>{const archive=await verifyReviewArchive(value);const id=archive.kind==='assignment'?archive.value.id:archive.kind==='review-work'?archive.value.submission.id:archive.value.work.submission.id;return chooseExport('jective',archive.kind+'-'+id,encodeArchive(archive.kind,archive.value));});
  handler('classroom:assignment',async value=>{store.assignment(AssignmentSchema.parse(value));return true;});handler('classroom:list',async()=>store.classroom());handler('classroom:grade',async value=>{store.grade(GradeSchema.parse(value));return true;});
  handler('classroom:import',async()=>{const archive=await chooseArchive();if(!archive)return 'cancelled';if(archive.kind==='assignment'){store.assignment(archive.value);return 'assignment imported';}if(archive.kind==='submission')return store.submission(archive.value);throw new Error('ARCHIVE_KIND');});
  handler('classroom:export',async value=>{const p=z.object({kind:z.enum(['assignment','submission','report']),value:z.unknown()}).strict().parse(value);if(p.kind==='report'){const data=store.classroom();const rows=[['learner','assignment','submission','version','score','evidence','feedback'].map(csvCell).join(',')];for(const s of data.submissions){const grade=data.grades.find(g=>g.submissionId===s.id);rows.push([s.learnerId,s.assignmentId,s.id,s.version,grade?Object.values(grade.scores).reduce((a,b)=>a+b,0):'',s.evidence.map(e=>e.kind).join(';'),grade?.feedback??''].map(csvCell).join(','));}return chooseExport('csv','classroom-report','\uFEFF'+rows.join('\r\n'));}const parsed=p.kind==='assignment'?AssignmentSchema.parse(p.value):SubmissionSchema.parse(p.value);const exported=await chooseExport('jective',p.kind+'-'+parsed.id,encodeArchive(p.kind,parsed));if(exported&&p.kind==='submission')store.submission(SubmissionSchema.parse(parsed));return exported;});
  handler('workspace:backup',async()=>{const s=await dialog.showSaveDialog(win,{defaultPath:'jective-workspace.sqlite',filters:[{name:'SQLite backup',extensions:['sqlite']}]});if(s.canceled||!s.filePath)return false;await store.backup(s.filePath);return true;});
  handler('workspace:restore',async()=>{if(buildBusy||projectBusy)throw new Error('WORKSPACE_BUSY');const s=await dialog.showOpenDialog(win,{filters:[{name:'SQLite backup',extensions:['sqlite']}],properties:['openFile']});const path=s.filePaths[0];if(s.canceled||!path)return false;if((await stat(path)).size>64*1024*1024)throw new Error('BACKUP_TOO_LARGE');const imported=inspectBackup(path);const confirmed=await dialog.showMessageBox(win,brandedMessage({buttons:['Cancel','Restore backup'],defaultId:0,cancelId:0,message:'Replace local workspace records? A backup of the current database will be retained.'}));if(confirmed.response!==1)return false;const target=store.path;const staged=target+'.restore-'+Date.now();const checked=new WorkspaceStore(staged);try{populateBackup(checked,imported);checked.state();}finally{checked.close();}await store.backup(target+'.before-restore.sqlite');store.close();const previous=target+'.replaced-'+Date.now();let moved=false;try{await rm(target+'-wal',{force:true});await rm(target+'-shm',{force:true});await rename(target,previous);moved=true;await rename(staged,target);store=new WorkspaceStore(target);}catch(e){if(moved){try{await rename(previous,target);}catch{}}store=new WorkspaceStore(target);throw e;}clearCurrentDocument();return true;});
  win.once('ready-to-show',()=>{if(placement.maximized)win.maximize();win.show();});await win.loadURL('jective://studio/index.html');
}).catch(async e=>{
 const code=safeErrorCode(e);operationLog?.record('startup',code);
 try{await dialog.showMessageBox(brandedMessage({type:'error',buttons:['Close'],title:'Unable to start',message:'The app could not start. Local project data has not been cleared. Ask your administrator to check the installation and app data.',detail:'JECTIVE '+code}));await operationLog?.flush();}
 catch{console.error('JECTIVE startup failed:',code);}
 finally{app.quit();}
});
let deviceShutdownComplete=false;let deviceShutdownStarted=false;
app.on('before-quit',event=>{service?.cancel();if(deviceShutdownComplete)return;event.preventDefault();if(deviceShutdownStarted)return;deviceShutdownStarted=true;void Promise.race([devices.close().catch(()=>undefined),new Promise<void>(resolve=>setTimeout(resolve,1000))]).finally(()=>{store?.close();deviceShutdownComplete=true;app.quit();});});app.on('window-all-closed',()=>app.quit());


