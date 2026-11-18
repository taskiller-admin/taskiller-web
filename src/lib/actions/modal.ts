import { tick } from 'svelte';

export function modalFocus(node: HTMLElement, options: { onclose: () => void; canClose?: () => boolean }) {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const oldOverflow = document.body.style.overflow;
  const siblings: { element: HTMLElement; inert: boolean }[] = [];
  let branch: HTMLElement = node;
  while (branch.parentElement && branch !== document.body) {
    for (const element of Array.from(branch.parentElement.children)) {
      if (element !== branch && element instanceof HTMLElement) {
        siblings.push({ element, inert: element.inert });
        element.inert = true;
      }
    }
    branch = branch.parentElement;
  }
  document.body.style.overflow = 'hidden';
  const focusable = () => Array.from(node.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')).filter(e => e.getClientRects().length > 0);
  node.tabIndex = -1;
  void tick().then(() => { if (node.isConnected) (focusable()[0] ?? node).focus(); });
  function keydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (options.canClose?.() !== false) options.onclose();
    }
    if (event.key === 'Tab') {
      const targets = focusable();
      const first = targets[0];
      const last = targets.at(-1);
      if (!first) { event.preventDefault(); node.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
  node.addEventListener('keydown', keydown);
  return {
    update(next: typeof options) { options = next; },
    destroy() {
      node.removeEventListener('keydown', keydown);
      for (const { element, inert } of siblings) element.inert = inert;
      document.body.style.overflow = oldOverflow;
      if (previous?.isConnected) previous.focus();
    }
  };
}
