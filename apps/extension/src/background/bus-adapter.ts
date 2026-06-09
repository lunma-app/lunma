import {
  type CommandMessage,
  SIDEBAR_COMMAND_KINDS,
  type SidebarCommand,
  type SidebarCommandKind,
} from '../shared/bus';
import { log } from '../shared/logger';
import { type Coordinator, defaultEmitAck, type PendingEvent } from './coordinator';

// Task 2.x: bus adapter — translates `'lunma/command'` messages into coordinator
// enqueues. Holds no state of its own; coordinator owns correlation-to-ack
// bookkeeping (D2).

type SidebarPendingEvent = Extract<PendingEvent, { source: 'sidebar' }>;

function toPendingEvent(cmd: SidebarCommand, correlationId: string): SidebarPendingEvent {
  return {
    source: 'sidebar',
    kind: cmd.kind,
    payload: cmd.payload,
    correlationId,
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

    const event = toPendingEvent(cmd as SidebarCommand, id);
    void whenReady.then(() => coordinator.enqueue(event));
  };

  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
