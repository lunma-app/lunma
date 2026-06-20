import {
  type CommandMessage,
  SIDEBAR_COMMAND_KINDS,
  type SidebarCommand,
  type SidebarCommandKind,
  SidebarCommandSchema,
} from '../shared/bus';
import { log } from '../shared/logger';
import { type Coordinator, defaultEmitAck, type PendingEvent } from './coordinator';

// Task 2.x: bus adapter — translates `'lunma/command'` messages into coordinator
// enqueues. Holds no state of its own; coordinator owns correlation-to-ack
// bookkeeping (D2).

type SidebarPendingEvent = Extract<PendingEvent, { source: 'sidebar' }>;

// `toPendingEvent` maps a validated `SidebarCommand` to the coordinator's
// `SidebarPendingEvent`. TypeScript cannot verify the `{ kind, payload }` pair is
// a valid discriminated-union member from spreads alone (the correlation is lost
// when `cmd.kind` and `cmd.payload` are accessed separately), so a cast is
// unavoidable. The compile-time `satisfies` below narrows it to a deliberate,
// field-by-field shape check rather than a broad blind cast: all four required
// fields must be structurally present and correctly typed. The payload shape is
// guaranteed correct because `parsed.data` (the call site) passed
// `SidebarCommandSchema.safeParse` — the per-kind Zod schema — before reaching here.
function toPendingEvent(cmd: SidebarCommand, correlationId: string): SidebarPendingEvent {
  return {
    source: 'sidebar',
    kind: cmd.kind,
    payload: cmd.payload,
    correlationId,
  } satisfies {
    source: 'sidebar';
    kind: SidebarCommand['kind'];
    payload: SidebarCommand['payload'];
    correlationId: string;
  } as SidebarPendingEvent;
}

/**
 * Register the sidebar-command listener on `chrome.runtime.onMessage`.
 *
 * The caller MUST register this synchronously in the service worker's first
 * top-level turn (NOT inside an async boot chain). MV3 only routes a wake-up
 * message — the very message that spun the dormant SW back up — to listeners
 * that already exist in that first turn; a listener added later (after an
 * `await`) misses it and the sender sees "Could not establish connection.
 * Receiving end does not exist", silently dropping the command.
 *
 * To preserve the boot-order contract (boot mutations finish before any command
 * mutates state), the listener defers each command's `coordinator.enqueue` until
 * `whenReady` resolves. Validation and error-acks still happen synchronously.
 * Arrival order is preserved: callbacks gated on the same promise fire in
 * registration order.
 */
export function installBusAdapter(
  coordinator: Coordinator,
  whenReady: Promise<unknown> = Promise.resolve(),
): () => void {
  const listener = (raw: unknown, sender: chrome.runtime.MessageSender): void => {
    if (sender.id !== chrome.runtime.id) return;
    if (!raw || typeof raw !== 'object') return;
    const m = raw as Partial<CommandMessage>;
    if (m.type !== 'lunma/command') return;

    const id = m.id;
    const cmd = m.cmd;
    if (typeof id !== 'string' || !cmd || typeof cmd !== 'object') return;

    const kind = (cmd as { kind?: unknown }).kind;
    if (typeof kind !== 'string' || !SIDEBAR_COMMAND_KINDS.has(kind as SidebarCommandKind)) {
      log.error('BUS_UNKNOWN_KIND', { id, kind });
      defaultEmitAck({ type: 'lunma/command-ack', id, result: { error: 'unknown command kind' } });
      return;
    }

    // Full-payload validation (Task 2.x): the `kind` is recognised, but the
    // payload is page-influenced and untrusted (the boundary content script
    // forwards anchor hrefs into `openUrl`, etc.). Parse the whole command
    // against the schema; a schema-invalid payload is rejected with a descriptive
    // ack and never enqueued — symmetric with the fully-Zod-validated storage
    // boundary, and so a handler never receives malformed data.
    const parsed = SidebarCommandSchema.safeParse(cmd);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'invalid command payload';
      log.error('BUS_INVALID_PAYLOAD', { id, kind, issues: parsed.error.issues });
      defaultEmitAck({ type: 'lunma/command-ack', id, result: { error: message } });
      return;
    }

    // `parsed.data` is the validated command. Its inferred type differs from
    // `SidebarCommand` only because Zod's `.optional()` adds `| undefined` to
    // optional fields while the hand-written union uses `exactOptionalPropertyTypes`
    // semantics (the field is absent, not `undefined`). The cast is harmless: the
    // field values themselves are identical at runtime, and `toPendingEvent` now
    // forwards `cmd.payload` without a further cast.
    const event = toPendingEvent(parsed.data as SidebarCommand, id);
    void whenReady.then(() => coordinator.enqueue(event));
  };

  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
