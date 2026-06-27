/**
 * `scrollFade` — a shared scroll affordance (design language): any scrollable
 * area gets a soft mask fade on an edge that still has content beyond it, and
 * NO fade on an edge you've reached. So a list scrolled to the top fades only at
 * the bottom ("more below"); scrolled to the middle it fades both edges; scrolled
 * to the very bottom the bottom fade disappears. A non-overflowing area gets no
 * fade at all. Works on either axis (vertical by default, horizontal for boards
 * / carousels via `{ axis: 'x' }`).
 *
 * Drop it onto any element that already scrolls (its own `overflow` + size cap
 * stay the consumer's concern):
 *
 *   <div class="grid" use:scrollFade>…</div>
 *   <div class="lanes" use:scrollFade={{ axis: 'x' }}>…</div>
 *
 * Implementation: a single `mask-image` whose two ends are driven by the
 * `--scroll-fade-start` / `--scroll-fade-end` custom properties, toggled between
 * `0px` (no fade) and the shared `--scroll-fade` token depth as the scroll
 * position changes. Reads are rAF-throttled; `scroll`, a `ResizeObserver` (the
 * viewport resized) and a `MutationObserver` (the content changed) all trigger a
 * re-measure, so the fades stay correct as content loads, filters, refreshes, or
 * the panel is resized.
 */

/** Scroll axis to fade. Default `y`. */
export type ScrollFadeAxis = 'y' | 'x';
/** Which edges may fade (axis-relative). Default `both`. */
export type ScrollFadeEdges = 'both' | 'start' | 'end';

export interface ScrollFadeOptions {
  axis?: ScrollFadeAxis;
  edges?: ScrollFadeEdges;
}

// Opaque (visible) between the two fade depths, transparent (clipped) at each
// end — the depths are 0 when that edge is fully reached, so the fade vanishes.
function maskFor(axis: ScrollFadeAxis): string {
  const direction = axis === 'x' ? 'to right' : 'to bottom';
  return (
    `linear-gradient(${direction},` +
    ' transparent 0,' +
    ' #000 var(--scroll-fade-start, 0px),' +
    ' #000 calc(100% - var(--scroll-fade-end, 0px)),' +
    ' transparent 100%)'
  );
}

export function scrollFade(
  node: HTMLElement,
  options: ScrollFadeOptions = {},
): { update(next: ScrollFadeOptions): void; destroy(): void } {
  let axis: ScrollFadeAxis = options.axis ?? 'y';
  let edges: ScrollFadeEdges = options.edges ?? 'both';

  function applyMask(): void {
    const mask = maskFor(axis);
    node.style.setProperty('-webkit-mask-image', mask);
    node.style.setProperty('mask-image', mask);
  }
  applyMask();

  let frame = 0;

  function measure(): void {
    frame = 0;
    const pos = axis === 'x' ? node.scrollLeft : node.scrollTop;
    const size = axis === 'x' ? node.scrollWidth : node.scrollHeight;
    const view = axis === 'x' ? node.clientWidth : node.clientHeight;
    const max = size - view;
    const overflowing = max > 1;
    // ±1px tolerance for sub-pixel/zoom rounding at the extremes.
    const atStart = pos <= 1;
    const atEnd = pos >= max - 1;
    const fadeStart = overflowing && edges !== 'end' && !atStart;
    const fadeEnd = overflowing && edges !== 'start' && !atEnd;
    node.style.setProperty('--scroll-fade-start', fadeStart ? 'var(--scroll-fade)' : '0px');
    node.style.setProperty('--scroll-fade-end', fadeEnd ? 'var(--scroll-fade)' : '0px');
  }

  function schedule(): void {
    if (frame) return;
    if (typeof requestAnimationFrame === 'function') {
      frame = requestAnimationFrame(measure);
    } else {
      measure();
    }
  }

  node.addEventListener('scroll', schedule, { passive: true });

  let resize: ResizeObserver | undefined;
  if (typeof ResizeObserver !== 'undefined') {
    resize = new ResizeObserver(schedule);
    resize.observe(node);
  }

  let mutation: MutationObserver | undefined;
  if (typeof MutationObserver !== 'undefined') {
    mutation = new MutationObserver(schedule);
    mutation.observe(node, { childList: true, subtree: true });
  }

  measure();

  return {
    update(next: ScrollFadeOptions): void {
      const nextAxis = next.axis ?? 'y';
      if (nextAxis !== axis) {
        axis = nextAxis;
        applyMask();
      }
      edges = next.edges ?? 'both';
      measure();
    },
    destroy(): void {
      node.removeEventListener('scroll', schedule);
      resize?.disconnect();
      mutation?.disconnect();
      if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
    },
  };
}
