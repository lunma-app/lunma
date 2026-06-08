// Minimal `chrome.*` shim so the real sidebar code can mount in a plain browser
// tab (no extension context). Side-effect module — imported FIRST in main.ts so
// the shim exists before App.svelte's module graph (bus.ts, etc.) runs.
const noop = (): void => undefined;
// Commit log: bus.send({kind:'activateSpace'}) flows here (chromeTransport →
// chrome.runtime.sendMessage). main.ts overrides sendMessage to add the simulated
// coordinator, but keeps pushing here, so the count is the exact number of Space
// commits per physical gesture — the double-commit detector.
const commits: string[] = [];
(window as unknown as { __commits: string[] }).__commits = commits;

// onMessage listeners (the bus registers its ack listener here). `__emitMessage`
// lets main.ts deliver a command-ack so each fire-and-forget bus.send resolves
// instead of timing out after 10s and logging a BusTimeoutError.
const msgListeners: Array<(raw: unknown) => void> = [];
(window as unknown as { __emitMessage: (m: unknown) => void }).__emitMessage = (m) => {
  for (const l of msgListeners) l(m);
};

(globalThis as unknown as { chrome: unknown }).chrome = {
  runtime: {
    sendMessage: async (msg: unknown) => {
      const cmd = (msg as { cmd?: { kind?: string; payload?: { spaceId?: string } } })?.cmd;
      if (cmd?.kind === 'activateSpace' && cmd.payload?.spaceId) commits.push(cmd.payload.spaceId);
      return undefined;
    },
    onMessage: {
      addListener: (l: (raw: unknown) => void) => msgListeners.push(l),
      removeListener: (l: (raw: unknown) => void) => {
        const i = msgListeners.indexOf(l);
        if (i !== -1) msgListeners.splice(i, 1);
      },
    },
    getURL: (p: string) => p,
    openOptionsPage: noop,
    id: 'harness',
  },
  storage: {
    local: { get: async () => ({}), set: async () => undefined },
    sync: { get: async () => ({}), set: async () => undefined },
    onChanged: { addListener: noop, removeListener: noop },
  },
};
