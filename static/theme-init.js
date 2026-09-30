(() => {
  try {
    const stored = localStorage.getItem('taskiller-theme') || 'system';
    const dark = stored === 'dark' || (stored === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    const resolved = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = resolved;
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = resolved;
  } catch {
    // Theme preference is cosmetic; never block the app if storage is unavailable.
  }
})();
