export function spotlight(node: HTMLElement) {
  function move(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    node.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  }

  function leave() {
    node.style.removeProperty('--spot-x');
    node.style.removeProperty('--spot-y');
  }

  node.addEventListener('pointermove', move);
  node.addEventListener('pointerleave', leave);

  return {
    destroy() {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', leave);
    }
  };
}
