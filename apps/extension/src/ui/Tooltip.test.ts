import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import TooltipHarness from './Tooltip.test.harness.svelte';

describe('Tooltip', () => {
  test('renders the trigger when enabled (default)', () => {
    const { container } = render(TooltipHarness, { props: { label: 'Save file' } });
    expect(container.querySelector('[data-testid="trigger"]')).not.toBeNull();
  });

  test('enabled=false renders the trigger without tooltip infrastructure', () => {
    const { container } = render(TooltipHarness, {
      props: { label: 'Save file', enabled: false },
    });
    // Trigger is still rendered so the UI is not broken.
    expect(container.querySelector('[data-testid="trigger"]')).not.toBeNull();
    // No Bits tooltip root — the Provider/Root wrappers are absent.
    expect(container.querySelector('[data-tooltip-provider]')).toBeNull();
    expect(container.querySelector('[data-tooltip-root]')).toBeNull();
  });

  test('enabled=false: trigger receives no ARIA props from Bits', () => {
    const { container } = render(TooltipHarness, {
      props: { label: 'Save file', enabled: false },
    });
    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement;
    // When disabled the children snippet is called with an empty props object,
    // so no aria-describedby or data-* attributes from Bits are present.
    expect(trigger.getAttribute('aria-describedby')).toBeNull();
  });

  test('enabled=true (default): trigger receives ARIA props spread from Bits', () => {
    const { container } = render(TooltipHarness, { props: { label: 'Open settings' } });
    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement;
    // Bits spreads at minimum a data-bits-* state attribute onto the trigger.
    // We verify at least one attribute was forwarded (non-empty spread).
    const attrs = Array.from(trigger.attributes).map((a) => a.name);
    // data-testid is our own; the trigger should carry extra attributes from Bits.
    expect(attrs.length).toBeGreaterThan(1);
  });

  test('tooltip content is not visible in the DOM when closed', () => {
    const { container } = render(TooltipHarness, { props: { label: 'Delete item' } });
    // Bits uses forceMount + an open guard — the .lunma-tooltip div only renders
    // when the tooltip is open. In a non-interactive test it starts closed.
    expect(container.querySelector('.lunma-tooltip')).toBeNull();
  });

  test('enabled=false: tooltip content is never rendered', () => {
    const { container } = render(TooltipHarness, {
      props: { label: 'Delete item', enabled: false },
    });
    expect(container.querySelector('.lunma-tooltip')).toBeNull();
  });
});
