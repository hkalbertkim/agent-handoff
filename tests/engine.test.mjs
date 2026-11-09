import test from 'node:test';
import assert from 'node:assert/strict';
import {SessionEngine, REQUIRED_CONSTRAINT} from '../src/engine.mjs';

function command(session, actor, action, payload={}) {
 return session.command({token:session.tokens[actor],expectedVersion:session.version,idempotencyKey:crypto.randomUUID(),action,payload});
}
function ready(){
 const s=new SessionEngine();
 command(s,'A','START_TASK');
 return s;
}
function transfer(s){
 command(s,'A','PROPOSE_HANDOFF',{to:'B'});
 command(s,'B','ACCEPT_HANDOFF');
}
test('T1: B continues SAME session and actual task after explicit handoff',()=>{
 const s=ready(),id=s.id;
 command(s,'A','INSTRUCT',{instruction:'diagnose'});
 transfer(s);
 const result=command(s,'B','INSTRUCT',{instruction:'apply-safe-fix'});
 assert.equal(s.id,id);
 assert.equal(s.controller,'B');
 assert.equal(result.testsPassed,true);
 assert.equal(s.task.status,'passed');
 assert.equal(s.events.filter(e=>e.type==='HANDOFF_ACCEPTED').length,1);
});
test('T2: old controller and stale command cannot execute after handoff',()=>{
 const s=ready(),oldVersion=s.version;
 transfer(s);
 const before=s.sequence;
 assert.throws(()=>s.command({token:s.tokens.A,expectedVersion:s.version,idempotencyKey:crypto.randomUUID(),action:'INSTRUCT',payload:{instruction:'apply-safe-fix'}}),e=>e.code==='NOT_CONTROLLER');
 assert.throws(()=>s.command({token:s.tokens.B,expectedVersion:oldVersion,idempotencyKey:crypto.randomUUID(),action:'INSTRUCT',payload:{instruction:'apply-safe-fix'}}),e=>e.code==='STALE_VERSION');
 assert.equal(s.sequence,before);
 assert.equal(s.task.testsPassed,false);
});
test('T3: original constraint survives handoff and policy blocks forbidden tool action',()=>{
 const s=ready();
 transfer(s);
 assert.deepEqual(s.constraints,[REQUIRED_CONSTRAINT]);
 const blocked=command(s,'B','INSTRUCT',{instruction:'disable-auth'});
 assert.equal(blocked.blocked,true);
 assert.equal(s.task.status,'running');
 assert.equal(s.task.fixture.includes('function canLogin'),true);
 const valid=command(s,'B','INSTRUCT',{instruction:'apply-safe-fix'});
 assert.equal(valid.testsPassed,true);
 assert.equal(s.events.at(-2).type,'POLICY_BLOCKED');
});
test('only intended recipient can accept handoff; cannot double transfer',()=>{
 const s=ready();
 command(s,'A','PROPOSE_HANDOFF',{to:'B'});
 assert.throws(()=>command(s,'A','ACCEPT_HANDOFF'),e=>e.code==='HANDOFF_NOT_FOR_YOU');
 command(s,'B','ACCEPT_HANDOFF');
 assert.throws(()=>command(s,'B','ACCEPT_HANDOFF'),e=>e.code==='HANDOFF_NOT_FOR_YOU');
 assert.equal(s.events.filter(e=>e.type==='HANDOFF_ACCEPTED').length,1);
});
test('duplicate command is idempotent; no duplicate execution',()=>{
 const s=ready(),id=crypto.randomUUID();
 const body={token:s.tokens.A,expectedVersion:s.version,idempotencyKey:id,action:'INSTRUCT',payload:{instruction:'diagnose'}};
 const first=s.command(body),before=s.sequence,second=s.command(body);
 assert.equal(first.duplicate,undefined);
 assert.equal(second.duplicate,true);
 assert.equal(s.sequence,before);
 assert.equal(s.events.filter(e=>e.type==='AGENT_DIAGNOSIS').length,1);
});
test('unknown token cannot read or send commands',()=>{
 const s=ready();
 assert.throws(()=>s.actor('fake'),e=>e.status===401);
 assert.throws(()=>s.command({token:'fake',expectedVersion:s.version,idempotencyKey:crypto.randomUUID(),action:'INSTRUCT'}),e=>e.status===401);
});
