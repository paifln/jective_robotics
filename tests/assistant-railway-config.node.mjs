import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {configureRailway,runPrivate} from '../services/assistant/deploy/railway/configure.mjs';
import {prepareLocal} from '../services/assistant/setup-local.mjs';
import {removeFixtureDirectory} from './fixture-directory.node.mjs';

test('Railway configuration binds an explicit destination and sends values only through stdin without deploying',async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-railway-config-')),data=join(root,'data'),master=join(root,'master');await mkdir(data);await mkdir(master);
 try{
  const issued=await prepareLocal({data,master,model:'fixture-model',providerKey:'explicit-fake-config-provider'}),calls=[];
  const parameters={directory:data,project:'12345678-1234-1234-1234-123456789abc',service:'jective-assistant',binary:'explicit-fixture-cli'};
  const result=await configureRailway(parameters,async(binary,args,input)=>{calls.push({binary,args,input});});
  assert.equal(result.configured,8);assert.equal(result.deployed,false);assert.equal(calls.length,8);
  const key=await readFile(join(master,'master.key'),'utf8');
  for(const {args,input}of calls){assert.ok(args.includes('--stdin'));assert.ok(args.includes('--skip-deploys'));assert.equal(args[args.indexOf('--project')+1],parameters.project);assert.equal(args[args.indexOf('--service')+1],parameters.service);assert.equal(args[args.indexOf('--environment')+1],'production');assert.ok(!args.join(' ').includes(key));assert.ok(!args.includes(input));assert.ok(!input.includes('explicit-fake-config-provider'));assert.ok(!input.includes(issued.token));}
  assert.equal(calls.find(call=>call.args[2]==='ASSISTANT_MASTER_KEY').input,key);
  await assert.rejects(configureRailway({...parameters,project:'implicit'},async()=>assert.fail('Invalid destination reached runner')));
  let attempted=0;await assert.rejects(configureRailway(parameters,async()=>{attempted++;if(attempted===2)throw new Error('explicit local failure');}));assert.equal(attempted,2);
 }finally{await removeFixtureDirectory(root);}
});

test('private CLI transport uses stdin and suppresses child output and secret-bearing error text',{timeout:10000},async()=>{
 const root=await mkdtemp(join(tmpdir(),'jective-railway-stdin-')),script=join(root,'fixture.mjs'),output=join(root,'observed.json'),secret='explicit-fake-stdin-secret';
 try{
  await writeFile(script,"import {writeFile} from 'node:fs/promises';let text='';for await(const bytes of process.stdin)text+=bytes;await writeFile(process.argv[2],JSON.stringify({args:process.argv.slice(2),text}));process.stdout.write(text);process.stderr.write(text);if(process.argv[3]==='fail')process.exitCode=1;");
  await runPrivate(process.execPath,[script,output],secret);const observed=JSON.parse(await readFile(output,'utf8'));assert.equal(observed.text,secret);assert.ok(!observed.args.includes(secret));
  await assert.rejects(runPrivate(process.execPath,[script,output,'fail'],secret),error=>!error.message.includes(secret)&&error.message==='Railway variable request failed');
 }finally{await removeFixtureDirectory(root);}
});
