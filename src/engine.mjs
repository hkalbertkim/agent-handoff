import { randomBytes, randomUUID } from 'node:crypto';

export const REQUIRED_CONSTRAINT = 'Never disable or bypass authentication';
const FIXTURE_BROKEN = 'export function canLogin(password) { return password.length > 8; }';

export class SessionError extends Error {
  constructor(code, message, status = 409) {
    super(message);
    this.name = 'SessionError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Authoritative single-process session state.
 * Exactly two actors, a monotonic version, and an append-only event log.
 * Tokens are capabilities for this local demonstration; not production authentication.
 */
export class SessionEngine {
  constructor({agent = null} = {}) {
    this.id = randomUUID();
    this.tokens = {
      A: randomBytes(20).toString('hex'),
      B: randomBytes(20).toString('hex')
    };
    this.controller = 'A';
    this.version = 0;
    this.sequence = 0;
    this.task = { status: 'ready', goal: 'Fix the login edge-case without weakening authentication', fixture: FIXTURE_BROKEN, testsPassed: false };
    this.constraints = [REQUIRED_CONSTRAINT];
    this.pendingHandoff = null;
    this.events = [];
    this.seen = new Map();
    this.listeners = new Set();
    this.agent = agent;
    this.emit('SESSION_CREATED', 'system', { note: 'Two actors share one canonical session.' });
  }

  actor(token) {
    const entry = Object.entries(this.tokens).find(([, value]) => value === token);
    if (!entry) throw new SessionError('UNAUTHORIZED', 'Invalid session capability', 401);
    return entry[0];
  }

  snapshot() {
    return {
      id: this.id,
      version: this.version,
      controller: this.controller,
      pendingHandoff: this.pendingHandoff ? { to: this.pendingHandoff.to, from: this.pendingHandoff.from } : null,
      constraints: [...this.constraints],
      task: {...this.task, fixture: this.task.fixture},
      sequence: this.sequence,
      events: this.events.map(e => ({...e, data: {...e.data}})),
      agentMode: this.agent ? 'model-assisted' : 'scripted-demo'
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(type, actor, data = {}) {
    const event = {seq: ++this.sequence, time: new Date().toISOString(), type, actor, data};
    this.events.push(event);
    // Publish only after the synchronous state transition commits its version.
    // Otherwise observers receive a stale version and their next command conflicts.
    queueMicrotask(() => {
      for (const listener of this.listeners) listener(event);
    });
    return event;
  }

  #requireController(actor) {
    if (actor !== this.controller) throw new SessionError('NOT_CONTROLLER', 'Only the current controller can issue this command', 403);
  }

  #requireVersion(version) {
    if (!Number.isInteger(version) || version !== this.version)
      throw new SessionError('STALE_VERSION', 'Session version changed; refresh and retry', 409);
  }

  // Recheck authorization both before and after any asynchronous model request.
  // Handoffs invalidate in-flight diagnoses: a former controller cannot publish.
  assertCanDiagnose({token, expectedVersion}) {
    const actor = this.actor(token);
    this.#requireVersion(expectedVersion);
    this.#requireController(actor);
    if (this.task.status !== 'running')
      throw new SessionError('NOT_RUNNING', 'Task must be running');
    return actor;
  }

  recordModelDiagnosis({token, expectedVersion, analysis}) {
    const actor = this.assertCanDiagnose({token, expectedVersion});
    if (typeof analysis !== 'string' || !analysis.trim())
      throw new SessionError('INVALID_MODEL_OUTPUT', 'Diagnosis must not be empty', 422);
    this.emit('LIVE_MODEL_DIAGNOSIS', actor, {analysis: analysis.slice(0, 1400)});
    this.version++;
    return {ok: true, version: this.version, snapshot: this.snapshot()};
  }

  /**
   * Actions are synchronous and serialized within this Node process.
   * There are no await points between authorization, mutation and event emission.
   */
  command({token, expectedVersion, idempotencyKey, action, payload = {}}) {
    const actor = this.actor(token);
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8 || idempotencyKey.length > 128)
      throw new SessionError('BAD_IDEMPOTENCY_KEY', 'A unique idempotency key is required', 400);
    const scopeKey = actor + ':' + idempotencyKey;
    if (this.seen.has(scopeKey)) return {...this.seen.get(scopeKey), duplicate: true};
    this.#requireVersion(expectedVersion);

    let result = {ok: true};
    switch (action) {
      case 'START_TASK': {
        this.#requireController(actor);
        if (this.task.status !== 'ready') throw new SessionError('ALREADY_STARTED', 'This task has already started');
        this.task.status = 'running';
        this.emit('TASK_STARTED', actor, {goal: this.task.goal, constraints: [...this.constraints]});
        break;
      }
      case 'PROPOSE_HANDOFF': {
        this.#requireController(actor);
        if (this.task.status === 'ready') throw new SessionError('NOT_STARTED', 'Start task before handoff');
        if (this.pendingHandoff) throw new SessionError('HANDOFF_PENDING', 'A handoff is already pending');
        const to = payload.to;
        if (!['A', 'B'].includes(to) || to === actor)
          throw new SessionError('INVALID_RECIPIENT', 'Choose the other participant', 400);
        this.pendingHandoff = {from: actor, to};
        this.emit('HANDOFF_PROPOSED', actor, {to});
        break;
      }
      case 'ACCEPT_HANDOFF': {
        if (!this.pendingHandoff || this.pendingHandoff.to !== actor)
          throw new SessionError('HANDOFF_NOT_FOR_YOU', 'Only the named recipient can accept this handoff', 403);
        const from = this.controller;
        this.controller = actor;
        this.pendingHandoff = null;
        this.emit('HANDOFF_ACCEPTED', actor, {from, to: actor, preservedConstraints: [...this.constraints]});
        break;
      }
      case 'REJECT_HANDOFF': {
        if (!this.pendingHandoff || this.pendingHandoff.to !== actor)
          throw new SessionError('HANDOFF_NOT_FOR_YOU', 'Only the named recipient can reject this handoff', 403);
        this.pendingHandoff = null;
        this.emit('HANDOFF_REJECTED', actor, {});
        break;
      }
      case 'INSTRUCT': {
        this.#requireController(actor);
        if (this.task.status !== 'running') throw new SessionError('NOT_RUNNING', 'Task must be running');
        const instruction = payload.instruction;
        if (!['diagnose', 'disable-auth', 'apply-safe-fix'].includes(instruction))
          throw new SessionError('UNSUPPORTED_ACTION', 'Instruction not in local fixture allowlist', 400);
        if (instruction === 'disable-auth') {
          this.emit('POLICY_BLOCKED', actor, {instruction, reason: REQUIRED_CONSTRAINT});
          result = {ok: false, blocked: true, reason: REQUIRED_CONSTRAINT};
          break;
        }
        if (instruction === 'diagnose') {
          const finding = 'Fixture rejects passwords of exactly 8 characters; policy requires authentication to remain enabled.';
          this.emit('AGENT_DIAGNOSIS', actor, {finding, agentMode: this.agent ? 'model-assisted' : 'scripted-demo'});
          break;
        }
        // Real deterministic fixture mutation and assertions; NOT an LLM-generated patch.
        const before = this.task.fixture;
        if (!before.includes('password.length > 8'))
          throw new SessionError('UNEXPECTED_FIXTURE', 'Unexpected fixture state', 409);
        const after = before.replace('password.length > 8', 'password.length >= 8');
        if (!after.includes('function canLogin') || !after.includes('password.length >= 8'))
          throw new SessionError('POLICY_FAILED', 'Authentication constraint did not pass', 422);
        this.task.fixture = after;
        const login = (password) => password.length >= 8;
        this.task.testsPassed = !login('1234567') && login('12345678') && login('123456789');
        this.task.status = this.task.testsPassed ? 'passed' : 'failed';
        this.emit('FIX_APPLIED', actor, {before, after, actualAssertions: 3, testsPassed: this.task.testsPassed});
        result = {ok: this.task.testsPassed, testsPassed: this.task.testsPassed};
        break;
      }
      default:
        throw new SessionError('UNKNOWN_ACTION', 'Unrecognized action', 400);
    }
    this.version++;
    const reply = {...result, version: this.version, snapshot: this.snapshot()};
    this.seen.set(scopeKey, reply);
    return reply;
  }
}
