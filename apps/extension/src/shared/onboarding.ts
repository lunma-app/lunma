import { z } from 'zod';
import { log } from './logger';

/**
 * One-time onboarding flags, persisted in `chrome.storage.sync` under
 * `'lunma.onboarding'` — a sibling of `'lunma.settings'`, NOT part of `AppState`
 * (so `storage-and-migrations` is untouched). Today it carries a single flag: has
 * the user dismissed the auto-archive first-run disclosure notice. `sync` (not
 * `local`) so a user who dismisses on one device is not re-nagged on another.
 *
 * Shape mirrors `settings.ts`: a Zod schema with `.catch(default)` per field, so a
 * malformed/absent stored value degrades to `DEFAULTS` rather than failing the read,
 * and writes are best-effort (caught + logged — a disclosure flag must never block
 * the UI).
 */

const ONBOARDING_KEY = 'lunma.onboarding';

export interface Onboarding {
  /** Whether the auto-archive first-run notice has been dismissed. Starts `false`
   * for every user (including existing installs), so the one-time heads-up shows
   * on the next sidebar open while auto-archive is enabled. */
  autoArchiveNoticeDismissed: boolean;
}

export const DEFAULTS: Onboarding = {
  autoArchiveNoticeDismissed: false,
};

/** Per-field `.catch(default)`, like `SettingsSchema`: a wrong-typed or absent
 * field falls back to its default rather than failing the whole read. */
export const OnboardingSchema: z.ZodType<Onboarding> = z.object({
  autoArchiveNoticeDismissed: z.boolean().catch(DEFAULTS.autoArchiveNoticeDismissed),
});

// Compile-time guard (mirrors `settings.ts`): the schema's output type must match
// the exported `Onboarding` interface.
type AssertEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const _schemaMatchesOnboarding: AssertEqual<z.infer<typeof OnboardingSchema>, Onboarding> = true;
void _schemaMatchesOnboarding;

/** Read the onboarding record from `chrome.storage.sync`, parsed through the
 * schema. Returns `DEFAULTS` on absence, a malformed object, or any storage
 * failure (the notice shows rather than erroring). */
export async function loadOnboarding(): Promise<Onboarding> {
  try {
    const got = await chrome.storage.sync.get(ONBOARDING_KEY);
    const parsed = OnboardingSchema.safeParse(got[ONBOARDING_KEY]);
    return parsed.success ? parsed.data : { ...DEFAULTS };
  } catch (err) {
    log.error('loadOnboarding failed', { err });
    return { ...DEFAULTS };
  }
}

/** Persist `autoArchiveNoticeDismissed` into the onboarding record. Never rejects
 * to the caller: a storage failure is caught and logged (worst case the notice
 * re-appears next session rather than blocking the dismiss). */
export async function setAutoArchiveNoticeDismissed(value: boolean): Promise<void> {
  try {
    const current = await loadOnboarding();
    const next: Onboarding = { ...current, autoArchiveNoticeDismissed: value };
    await chrome.storage.sync.set({ [ONBOARDING_KEY]: next });
  } catch (err) {
    log.error('setAutoArchiveNoticeDismissed failed', { err, value });
  }
}
