import { beforeNavigate } from '$app/navigation';
import { onMount } from 'svelte';

export function protectUnsaved(isDirty: () => boolean) {
  beforeNavigate((navigation) => {
    if (navigation.willUnload || !isDirty()) return;
    if (!window.confirm('Leave without saving your changes?')) navigation.cancel();
  });
  onMount(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (!isDirty()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  });
}
