import { describe, expect, test } from 'vitest';
import { scrollFade } from './scroll-fade';

/** A detached element with mocked vertical scroll metrics (jsdom reports 0). */
function scrollable(metrics: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollHeight', { value: metrics.scrollHeight, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: metrics.clientHeight, configurable: true });
  Object.defineProperty(el, 'scrollTop', {
    value: metrics.scrollTop,
    writable: true,
    configurable: true,
  });
  return el;
}

/** A detached element with mocked horizontal scroll metrics. */
function scrollableX(metrics: {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollWidth', { value: metrics.scrollWidth, configurable: true });
  Object.defineProperty(el, 'clientWidth', { value: metrics.clientWidth, configurable: true });
  Object.defineProperty(el, 'scrollLeft', {
    value: metrics.scrollLeft,
    writable: true,
    configurable: true,
  });
  return el;
}

const ON = 'var(--scroll-fade)';
const OFF = '0px';
const start = (el: HTMLElement) => el.style.getPropertyValue('--scroll-fade-start');
const end = (el: HTMLElement) => el.style.getPropertyValue('--scroll-fade-end');

describe('scrollFade', () => {
  test('at the start of an overflowing area: end fades, start does not', () => {
    const el = scrollable({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 });
    scrollFade(el);
    expect(start(el)).toBe(OFF);
    expect(end(el)).toBe(ON);
  });

  test('in the middle: both edges fade', () => {
    const el = scrollable({ scrollTop: 400, scrollHeight: 1000, clientHeight: 200 });
    scrollFade(el);
    expect(start(el)).toBe(ON);
    expect(end(el)).toBe(ON);
  });

  test('at the end: start fades, end does not', () => {
    // max scroll = 1000 - 200 = 800
    const el = scrollable({ scrollTop: 800, scrollHeight: 1000, clientHeight: 200 });
    scrollFade(el);
    expect(start(el)).toBe(ON);
    expect(end(el)).toBe(OFF);
  });

  test('no overflow: neither edge fades', () => {
    const el = scrollable({ scrollTop: 0, scrollHeight: 200, clientHeight: 200 });
    scrollFade(el);
    expect(start(el)).toBe(OFF);
    expect(end(el)).toBe(OFF);
  });

  test('edges: "end" never fades the start even when scrolled down', () => {
    const el = scrollable({ scrollTop: 400, scrollHeight: 1000, clientHeight: 200 });
    scrollFade(el, { edges: 'end' });
    expect(start(el)).toBe(OFF);
    expect(end(el)).toBe(ON);
  });

  test('axis "x": fades along the horizontal scroll position', () => {
    // At the left start of a horizontally-overflowing board.
    const el = scrollableX({ scrollLeft: 0, scrollWidth: 1200, clientWidth: 400 });
    scrollFade(el, { axis: 'x' });
    expect(el.style.getPropertyValue('mask-image')).toContain('to right');
    expect(start(el)).toBe(OFF); // at the left edge
    expect(end(el)).toBe(ON); // more to the right
  });

  test('applies the mask and re-measures on update()', () => {
    const el = scrollable({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 });
    const action = scrollFade(el);
    expect(el.style.getPropertyValue('mask-image')).toContain('linear-gradient');
    expect(end(el)).toBe(ON);

    // Switching to edges:'start' re-measures synchronously and drops the end fade.
    action.update({ edges: 'start' });
    expect(end(el)).toBe(OFF);
    expect(start(el)).toBe(OFF); // still at the start, so the start edge stays unfaded

    action.destroy();
  });
});
