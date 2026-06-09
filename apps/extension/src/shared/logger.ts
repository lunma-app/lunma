type LogFn = (message: string, context?: Record<string, unknown>) => void;

interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

/** Unwrap `Error` instances inside a context payload so DevTools shows the
 * actual message + stack instead of just `Object`. Non-Error values pass
 * through unchanged. */
function unwrap(context: Record<string, unknown> | undefined): unknown {
  if (!context) return '';
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

export const log: Logger = {
  debug: (message, context) => console.debug('[lunma]', message, unwrap(context)),
  info: (message, context) => console.info('[lunma]', message, unwrap(context)),
  warn: (message, context) => console.warn('[lunma]', message, unwrap(context)),
  error: (message, context) => console.error('[lunma]', message, unwrap(context)),
};
