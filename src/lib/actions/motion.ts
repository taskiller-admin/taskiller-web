import type { Action } from 'svelte/action';

/** Animate newly mounted surfaces and direct manipulation without delaying navigation. */
export const motion: Action<HTMLElement> = (root) => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new WeakSet<Element>();
  const animations = new Set<Animation>();
  const paused = () => reduced.matches || document.documentElement.dataset.motion === 'paused';
  const play = (target: Element, frames: Keyframe[], options: KeyframeAnimationOptions) => {
    const animation = target.animate(frames, options);
    animations.add(animation);
    void animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
  };
  const stop = () => { if (paused()) for (const animation of animations) animation.cancel(); };
  const selector = '.tk-page > header, .tk-page > section, .tk-page > form, .tk-page > div, .tk-panel, .tk-empty-state, [data-motion]';
  const reveal = (scope: Element) => {
    if (paused()) return;
    const targets = [...(scope.matches(selector) ? [scope] : []), ...scope.querySelectorAll(selector)];
    targets.slice(0, 24).forEach((target, index) => {
      if (seen.has(target)) return;
      seen.add(target);
      // A transformed ancestor becomes the containing block for fixed controls.
      if (target.querySelector('.fixed, .tk-mobile-nav, .tk-account-menu') || getComputedStyle(target).position === 'fixed') return;
      if (target.getBoundingClientRect().height === 0) return;
      play(target, [
        { transform: 'translateY(12px)' },
        { transform: 'translateY(0)' }
      ], { duration: 420, delay: Math.min(index * 35, 180), easing: 'cubic-bezier(.16,1,.3,1)' });
    });
  };
  reveal(root);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) if (node instanceof HTMLElement) reveal(node);
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  const press = (event: PointerEvent) => {
    if (paused() || !(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLElement>('.tk-button, .tk-capture-link, .tk-nav-item, .tk-mobile-nav a');
    if (!target || target.hasAttribute('disabled')) return;
    play(target, [{ scale: '1' }, { scale: '.96' }, { scale: '1' }], { duration: 260, easing: 'ease-out' });
  };
  root.addEventListener('pointerdown', press);
  window.addEventListener('taskiller:motion', stop);
  reduced.addEventListener('change', stop);
  return { destroy() {
    observer.disconnect();
    root.removeEventListener('pointerdown', press);
    window.removeEventListener('taskiller:motion', stop);
    reduced.removeEventListener('change', stop);
    for (const animation of animations) animation.cancel();
  } };
};
