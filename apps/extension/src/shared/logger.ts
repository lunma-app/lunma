type LogFn = (message: string, context?: Record<string, unknown>) => void;

interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

/** Unwrap `Error` instances inside a context payload so the serialized output
 * carries the actual message + stack instead of an empty `{}` (JSON.stringify
 * drops Error's own enumerable-less properties). Non-Error values pass
 * through unchanged. */
function unwrap(context: Record<string, unknown> | undefined): unknown {
  if (!context) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(context)) {
    if (v instanceof Error) {
      out[k] = { message: v.message, stack: v.stack, name: v.name };
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** chrome://extensions' Errors page renders each console argument via plain
 * `String()`, so an object arg collapses to `[object Object]` there — unlike
 * an inspected DevTools console, it has no expand/collapse. Folding the
 * context into the message string itself keeps it readable on both surfaces. */
function format(message: string, context: Record<string, unknown> | undefined): string {
  const unwrapped = unwrap(context);
  return unwrapped === undefined
    ? `[lunma] ${message}`
    : `[lunma] ${message} ${JSON.stringify(unwrapped)}`;
}

export const log: Logger = {
  debug: (message, context) => console.debug(format(message, context)),
  info: (message, context) => console.info(format(message, context)),
  warn: (message, context) => console.warn(format(message, context)),
  error: (message, context) => console.error(format(message, context)),
};
