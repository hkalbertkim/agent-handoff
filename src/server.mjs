import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {SessionEngine, SessionError} from './engine.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const session = new SessionEngine();
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4177);

function json(res, status, body) {
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
  res.end(JSON.stringify(body));
}
function sendEvent(res, name, data) {
  res.write('event: ' + name + '\n' + 'data: ' + JSON.stringify(data) + '\n\n');
}
async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/') {
      const content = await readFile(join(root, 'public/index.html'));
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
      return res.end(content);
    }
    if (req.method === 'GET' && url.pathname === '/api/session') {
      const token = url.searchParams.get('token');
      const actor = session.actor(token);
      return json(res, 200, {actor, session: session.snapshot()});
    }
    if (req.method === 'GET' && url.pathname === '/api/events') {
      const token = url.searchParams.get('token');
      session.actor(token);
      res.writeHead(200, {'Content-Type':'text/event-stream', 'Cache-Control':'no-cache, no-store', 'Connection':'keep-alive', 'X-Content-Type-Options': 'nosniff'});
      sendEvent(res, 'snapshot', session.snapshot());
      const stop = session.subscribe((event) => sendEvent(res, 'update', {event, session: session.snapshot()}));
      const heartbeat = setInterval(()=>res.write(': ping\n\n'),20000);
      req.on('close',()=>{stop();clearInterval(heartbeat);});
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/command') {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 16384) throw new SessionError('BODY_TOO_LARGE', 'Command exceeds limit', 413);
      }
      let command;
      try {command = JSON.parse(raw);} catch {throw new SessionError('INVALID_JSON','Expected valid JSON',400);}
      const token = req.headers.authorization?.replace(/^Bearer /i,'');
      const result = session.command({...command, token});
      return json(res, 200, result);
    }
    return json(res,404,{error:'NOT_FOUND'});
  } catch (error) {
    if (error instanceof SessionError) return json(res,error.status,{error:error.code,message:error.message,sessionVersion:session.version});
    console.error(error);
    return json(res,500,{error:'INTERNAL_ERROR'});
  }
}
const server = http.createServer(handler);
if (process.env.NODE_ENV !== 'test') {
  server.listen(port,host,()=>{
    console.log('Agent Handoff live on http://'+host+':'+port);
    console.log('A/controller: http://'+host+':'+port+'/?token='+session.tokens.A);
    console.log('B/observer:   http://'+host+':'+port+'/?token='+session.tokens.B);
    console.log('Local-only demo. URLs are secret capability tokens. Do not expose them publicly.');
  });
}
export {server,session};
