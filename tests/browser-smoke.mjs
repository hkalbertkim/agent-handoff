import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {randomInt} from 'node:crypto';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const port = randomInt(30000, 45000);
const base = 'http://127.0.0.1:' + port;
const child=spawn(process.execPath,['src/server.mjs'],{
  env:{...process.env,HOST:'127.0.0.1',PORT:String(port)},stdio:['ignore','pipe','pipe']
});
let output='',browser;
child.stdout.on('data',c=>{output+=c.toString();});
try {
  for(let i=0;i<100 && !output.includes('Local-only demo');i++)await delay(50);
  assert.match(output,/Local-only demo/, 'Local server is available');
  const invitations=[...output.matchAll(/http:\/\/127\.0\.0\.1:\d+\/\?token=[a-f0-9]+/g)].map(x=>x[0]);
  assert.equal(invitations.length,2);
  browser=await chromium.launch({headless:true});
  const pageA=await browser.newPage({viewport:{width:1280,height:850}});
  const pageB=await browser.newPage({viewport:{width:1280,height:850}});
  await Promise.all([pageA.goto(invitations[0]),pageB.goto(invitations[1])]);
  await pageA.waitForFunction(()=>document.querySelector('#role')?.textContent==='You: A');
  await pageB.waitForFunction(()=>document.querySelector('#role')?.textContent==='You: B');
  assert.equal(await pageA.locator('#sessionId').textContent(),await pageB.locator('#sessionId').textContent());

  await pageA.locator('#start').click();
  await pageB.waitForFunction(()=>document.querySelector('#status')?.textContent==='running');
  await pageA.locator('#handoff').click();
  await pageB.locator('#accept').waitFor({state:'visible'});
  await pageB.waitForFunction(()=>!document.querySelector('#accept')?.disabled);
  await pageB.locator('#accept').click();
  await Promise.all([
    pageA.waitForFunction(()=>document.querySelector('#controller')?.textContent==='Controller: B'),
    pageB.waitForFunction(()=>document.querySelector('#controller')?.textContent==='Controller: B')
  ]);

  await pageA.locator('#probe').click();
  await pageA.waitForFunction(()=>document.querySelector('#notice')?.textContent.includes('NOT_CONTROLLER'));
  await pageB.locator('#forbidden').click();
  await pageB.waitForFunction(()=>document.querySelector('#notice')?.textContent.includes('POLICY BLOCKED'));
  await pageB.locator('#fix').click();
  await pageB.waitForFunction(()=>document.querySelector('#tests')?.textContent.includes('PASS: 3/3'));

  assert.equal(await pageA.locator('#model').isDisabled(),true,'live-model button disabled without configured API key');
  await mkdir('artifacts',{recursive:true});
  await pageA.screenshot({path:'artifacts/observer.png',fullPage:true});
  await pageB.screenshot({path:'artifacts/controller.png',fullPage:true});
  console.log('Browser E2E PASS: two independent Chromium pages, live sync, handoff, old-controller HTTP rejection, policy gate and real fixture assertions.');
} finally {
  if(browser)await browser.close();
  child.kill('SIGTERM');
}
