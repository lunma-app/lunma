import type { Action } from 'svelte/action';

// A scroll-reveal action. The first time the element enters the viewport it gets
// `data-revealed="true"`, so CSS (see app.css) can ease it in. It is careful in
// three ways the marketing-site a11y contract cares about:
//
//   1. SSR / no-JS safe — the un-revealed (offset + faded) state only applies
//      once this action arms the node on the client (`data-reveal="armed"`), so
//      prerendered HTML and visitors without JS see every section fully.
//   2. Reduced motion — when `prefers-reduced-motion: reduce` is set it reveals
//      immediately with no transform; the end state is identical.
//   3. Once only — the observer disconnects after the first intersection.
type RevealParams = { delay?: number } | undefined;

export const reveal: Action<HTMLElement, RevealParams> = (node, params) => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const show = (): void => {
    node.dataset.revealed = 'true';
  };

  if (params?.delay) node.style.setProperty('--reveal-delay', `${params.delay}ms`);

  if (reduce || typeof IntersectionObserver === 'undefined') {
    show();
    return {};
  }

  // Arm the offset/faded start state only now that JS can animate out of it.
  node.dataset.reveal = 'armed';

  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          show();
          obs.disconnect();
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
  );
  io.observe(node);

  return { destroy: () => io.disconnect() };
};
