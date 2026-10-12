/** Move overlays out of transformed/overflow-clipped ancestors, including work forms. */
export function portal(node: HTMLElement) {
  const previousOverflow = document.documentElement.style.overflow;
  document.body.appendChild(node);
  document.documentElement.style.overflow = 'hidden';
  return {
    destroy() {
      document.documentElement.style.overflow = previousOverflow;
      node.remove();
    }
  };
}
