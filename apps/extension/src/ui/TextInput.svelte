<script lang="ts">
interface Props {
  /** Visible label rendered above the field. Omit for an unlabelled field
   * (e.g. a search box that relies on its placeholder + `aria-label`). */
  label?: string | undefined;
  /** Accessible name when there is no visible `label`. */
  ariaLabel?: string | undefined;
  /** Current value (bindable). */
  value?: string;
  /** Placeholder text. */
  placeholder?: string | undefined;
  /** Autofocus the field on mount. */
  autofocus?: boolean | undefined;
  /** Tint the field's border to the danger hue and set `aria-invalid` — the
   * field holds a value the surrounding form rejects (e.g. a duplicate name). */
  invalid?: boolean | undefined;
  /** `data-testid` for the input element. Default `'text-input'`. */
  testid?: string | undefined;
  /** Touch-keyboard hint via the `inputmode` attribute (e.g. `'numeric'` for a
   * digits-only field). Omitted when undefined; the field stays a text input
   * (parsing/validation is the caller's concern). */
  inputmode?: 'text' | 'numeric' | 'decimal' | undefined;
  /** Input type. `'password'` masks the value (e.g. the Connectors token field
   * — smart-folders D10); default `'text'`. */
  type?: 'text' | 'password' | undefined;
  /** Fired on every input event with the new value. */
  oninput?: ((value: string) => void) | undefined;
  /** Fired when Enter is pressed (e.g. to submit the surrounding form). */
  onenter?: (() => void) | undefined;
}

let {
  label,
  ariaLabel,
  value = $bindable(''),
  placeholder,
  autofocus = false,
  invalid = false,
  testid = 'text-input',
  inputmode,
  type = 'text',
  oninput,
  onenter,
}: Props = $props();

function handleInput(event: Event): void {
  const next = (event.currentTarget as HTMLInputElement).value;
  value = next;
  oninput?.(next);
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault();
    onenter?.();
  }
}
</script>

<label class="field">
  {#if label !== undefined}
    <span class="label">{label}</span>
  {/if}
  <!-- svelte-ignore a11y_autofocus -->
  <input
    class="input"
    class:invalid
    {type}
    {inputmode}
    {value}
    {placeholder}
    {autofocus}
    aria-label={label === undefined ? ariaLabel : undefined}
    aria-invalid={invalid ? true : undefined}
    data-invalid={invalid}
    data-testid={testid}
    oninput={handleInput}
    onkeydown={handleKeydown}
  />
</label>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .label {
    font: var(--weight-semibold) var(--text-xs) / 1.2 var(--font-sans);
    letter-spacing: 0.01em;
    color: var(--text-muted);
  }

  /* A soft *filled* field — no hard idle border line. The fill lifts slightly
   * on hover; focus glides in a gentle accent halo + faint accent border over
   * --motion-base, so the whole interaction reads smooth rather than snapping
   * from a grey box to a saturated blue one. */
  .input {
    appearance: none;
    width: 100%;
    box-sizing: border-box;
    height: var(--control-h-md);
    padding: 0 var(--space-3);
    border: 1px solid transparent;
    border-radius: var(--r-md);
    background: var(--surface-2);
    color: var(--text);
    font: var(--weight-medium) var(--text-base) / 1 var(--font-sans);
    transition:
      border-color var(--motion-base) var(--ease-standard),
      box-shadow var(--motion-base) var(--ease-standard),
      background var(--motion-base) var(--ease-standard);
  }

  .input::placeholder {
    color: var(--text-faint);
  }

  .input:hover:not(:focus) {
    background: var(--surface-3);
  }

  .input:focus {
    outline: none;
    border-color: oklch(from var(--accent) l c h / 0.55);
    box-shadow: 0 0 0 3px var(--accent-soft);
    background: var(--surface-2);
  }

  /* Invalid state: a danger-hued border that holds whether or not the field is
   * focused (the accent halo is replaced by a danger one on focus). Tinted from
   * the shared `--danger` token, so it reads on every Space hue. */
  .input.invalid {
    border-color: oklch(from var(--danger) l c h / 0.65);
  }
  .input.invalid:focus {
    border-color: oklch(from var(--danger) l c h / 0.85);
    box-shadow: 0 0 0 3px oklch(from var(--danger) l c h / 0.18);
  }
</style>
