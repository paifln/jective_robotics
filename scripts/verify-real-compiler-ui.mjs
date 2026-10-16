import {parseArgs} from 'node:util';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,basename} from 'node:path';
import {access} from 'node:fs/promises';

const {values}=parseArgs({options:{toolchain:{type:'string'},application:{type:'string'},help:{type:'boolean',short:'h'}}});
if(values.help){console.log('npm run compiler:ui:check -- --toolchain <installed SDK directory> [--application <JECTIVE Robotics Studio.exe>]\nRuns valid/invalid compilation and recovery in an isolated profile. Does not install tools, access serial ports or upload firmware. The supplied SDK directory receives normal build files.');}
else{
 if(!values.toolchain)throw new Error('Provide the already installed pinned SDK with --toolchain; this command never installs it.');
 const toolchain=resolve(values.toolchain);await access(resolve(toolchain,'data/packages/esp32/hardware/esp32/3.3.12/platform.txt'));
 const application=values.application?resolve(values.application):undefined;
 if(application){if(basename(application)!=='JECTIVE Robotics Studio.exe')throw new Error('Choose the application executable, never Setup.');await access(application);}
 const env={...process.env};for(const name of ['ELECTRON_RUN_AS_NODE','OPENAI_API_KEY','ASSISTANT_MASTER_KEY','JECTIVE_ASSISTANT_SERVER','JECTIVE_ASSISTANT_TOKEN','JECTIVE_EXECUTABLE'])delete env[name];
 env.JECTIVE_REAL_COMPILER='1';env.JECTIVE_TOOLCHAIN_ROOT=toolchain;if(application)env.JECTIVE_EXECUTABLE=application;
 const cli=createRequire(import.meta.url).resolve('@playwright/test/cli');
 const child=spawn(process.execPath,[cli,'test','tests/e2e/compiler.spec.ts','--workers=1'],{cwd:fileURLToPath(new URL('..',import.meta.url)),env,windowsHide:true,stdio:'inherit',shell:false});
 child.once('error',()=>{process.stderr.write('Could not start the local compiler verification runner.\n');process.exitCode=1;});
 child.once('exit',code=>{process.exitCode=code??1;});
}
