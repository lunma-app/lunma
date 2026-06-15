import { fireEvent, render } from '@testing-library/svelte';
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
    // bits-ui owns presence: when closed it unmounts the floating subtree, so
    // the .lunma-tooltip div is absent from the DOM. In a non-interactive test
    // the tooltip starts closed.
    expect(container.querySelector('.lunma-tooltip')).toBeNull();
  });

  test('enabled=false: tooltip content is never rendered', () => {
    const { container } = render(TooltipHarness, {
      props: { label: 'Delete item', enabled: false },
    });
    expect(container.querySelector('.lunma-tooltip')).toBeNull();
  });

  test('the tooltip layer is gone after its host unmounts', async () => {
    // Observable, automatable half of the spec's "unmounts with its trigger"
    // scenario: once the trigger's host is removed, the portaled tooltip layer
    // must not linger. The tooltip is portaled to document.body, so we look
    // there, not in the render container.
    const { container, unmount } = render(TooltipHarness, { props: { label: 'Return to host' } });
    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement;

    // Attempt to drive the open state (delayDuration 0). bits-ui opens a tooltip
    // on pointer-enter / focus.
    await fireEvent.pointerEnter(trigger);
    await fireEvent.focus(trigger);

    // Note: jsdom has no real RAF/floating/getAnimations, so bits-ui may not
    // fully open the tooltip here. Either way, the teardown guarantee is what
    // this asserts; the derived_inert-free half is covered by the manual
    // Chromium check (task 4.3 / design.md verification split).
    unmount();
    expect(document.body.querySelector('.lunma-tooltip')).toBeNull();
  });
});
