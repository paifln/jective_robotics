import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import electron from 'electron';
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const sharedPackages=env.APPDATA?join(env.APPDATA,'jective-robotics-studio','toolchain','data','packages'):null;
if(!env.JECTIVE_TOOLCHAIN_ROOT&&!(sharedPackages&&existsSync(sharedPackages))&&existsSync('.toolchain/sdk/arduino-cli.yaml'))env.JECTIVE_TOOLCHAIN_ROOT=resolve('.toolchain/sdk');
const child=spawn(electron,['.'],{env,stdio:'inherit',windowsHide:false});
child.on('exit',code=>{process.exitCode=code??1;});
