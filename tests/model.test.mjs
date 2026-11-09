import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {modelDiagnosis} from '../src/model.mjs';
import {SessionEngine} from '../src/engine.mjs';

const cmd=(s,who,action,payload={})=>s.command({
  token:s.tokens[who],expectedVersion:s.version,
  idempotencyKey:randomUUID(),action,payload
});

test('live model adapter calls Responses API but gives no tools or write permission',async()=>{
  let called=false;
  const answer=await modelDiagnosis(
    {goal:'Fix edge-case',fixture:'password.length > 8',constraints:['Keep authentication']},
    {apiKey:'test-only',model:'stub-model',
      request:async(url,opts)=>{
        called=true;
        const body=JSON.parse(opts.body);
        assert.equal(body.store,false);
        assert.deepEqual(body.tools,undefined);
        assert.ok(body.input.includes('Keep authentication'));
        assert.equal(opts.headers.Authorization,'Bearer test-only');
        return {ok:true,json:async()=>({
          output:[{content:[{type:'output_text',text:'Use >= 8; do not remove authentication.'}]}]
        })};
      }}
  );
  assert.equal(called,true);
  assert.match(answer,/>= 8/);
});
test('adapter fails closed without API key',async()=>{
  await assert.rejects(()=>modelDiagnosis({goal:'x',fixture:'y',constraints:[]},{apiKey:''}),/MODEL_NOT_CONFIGURED/);
});
test('live diagnosis can only be committed by current controller after async operation',()=>{
  const s=new SessionEngine({agent:true});
  cmd(s,'A','START_TASK');
  const oldVersion=s.version;
  s.assertCanDiagnose({token:s.tokens.A,expectedVersion:oldVersion});
  cmd(s,'A','PROPOSE_HANDOFF',{to:'B'});
  cmd(s,'B','ACCEPT_HANDOFF');
  assert.throws(()=>s.recordModelDiagnosis({token:s.tokens.A,expectedVersion:oldVersion,analysis:'A report'}),e=>e.code==='STALE_VERSION');
  const fresh=s.version;
  const result=s.recordModelDiagnosis({token:s.tokens.B,expectedVersion:fresh,analysis:'Keep authentication; repair boundary condition.'});
  assert.equal(result.ok,true);
  assert.equal(s.events.at(-1).type,'LIVE_MODEL_DIAGNOSIS');
  assert.ok(s.events.at(-1).data.analysis.includes('Keep authentication'));
});
