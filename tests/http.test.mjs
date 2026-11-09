import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {randomUUID} from 'node:crypto';

// True HTTP integration: exercises both actors against a separate local server process.
// No external services, cloud accounts or production systems.
test('HTTP E2E: shared session, handoff, old-controller rejection, policy, safe fix', {timeout:15000}, async(t)=>{
  const port = 25000 + Math.floor(Math.random() * 20000);
  const base = 'http://127.0.0.1:' + port;
  const child = spawn(process.execPath, ['src/server.mjs'], {
    cwd:process.cwd(), env:{...process.env,HOST:'127.0.0.1',PORT:String(port)},
    stdio:['ignore','pipe','pipe']
  });
  t.after(()=>{if(!child.killed)child.kill('SIGTERM');});
  let output='';
  child.stdout.on('data', d=>{output+=d.toString();});
  let started=false;
  for(let i=0;i<100;i++){
    if(output.includes('Local-only demo')){started=true;break;}
    if(child.exitCode!==null)break;
    await delay(50);
  }
  assert.ok(started,'server started');
  const urls=[...output.matchAll(/http:\/\/127\.0\.0\.1:\d+\/\?token=([a-f0-9]+)/g)];
  assert.equal(urls.length,2,'two actor invite URLs');
  const tokenA=urls[0][1],tokenB=urls[1][1];
  const get=async(token)=>{
    const r=await fetch(base+'/api/session?token='+token);
    assert.equal(r.status,200);
    return (await r.json()).session;
  };
  let s=await get(tokenA),id=s.id;
  assert.equal(s.controller,'A');
  assert.equal((await get(tokenB)).id,id);
  const cmd=async(token,action,payload={},version=s.version)=>{
    const r=await fetch(base+'/api/command',{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body:JSON.stringify({action,payload,expectedVersion:version,idempotencyKey:randomUUID()})
    });
    const data=await r.json();
    if(data.snapshot)s=data.snapshot;
    return {status:r.status,data};
  };
  assert.equal((await cmd(tokenA,'START_TASK')).status,200);
  assert.equal((await cmd(tokenA,'PROPOSE_HANDOFF',{to:'B'})).status,200);
  assert.equal((await cmd(tokenB,'ACCEPT_HANDOFF')).status,200);
  assert.equal(s.controller,'B');
  const previousVersion=s.version;
  assert.equal((await cmd(tokenA,'INSTRUCT',{instruction:'diagnose'})).status,403);
  assert.equal((await cmd(tokenB,'INSTRUCT',{instruction:'diagnose'},previousVersion-1)).status,409);
  const blocked=await cmd(tokenB,'INSTRUCT',{instruction:'disable-auth'});
  assert.equal(blocked.data.blocked,true);
  assert.equal(s.task.status,'running');
  const completed=await cmd(tokenB,'INSTRUCT',{instruction:'apply-safe-fix'});
  assert.equal(completed.status,200);
  assert.equal(completed.data.testsPassed,true);
  assert.equal(s.task.status,'passed');
  assert.equal(s.id,id);
  assert.ok(s.events.some(e=>e.type==='POLICY_BLOCKED'));
  assert.ok(s.events.some(e=>e.type==='FIX_APPLIED'));
  const stranger=await fetch(base+'/api/session?token=not-authorized');
  assert.equal(stranger.status,401);
});