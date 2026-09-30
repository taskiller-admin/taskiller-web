<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Logo from '$lib/components/brand/Logo.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { logout } from '$lib/auth/session';
  import { cn } from '$lib/utils';
  import HouseIcon from 'phosphor-svelte/lib/HouseIcon';
  import TrayIcon from 'phosphor-svelte/lib/TrayIcon';
  import FolderSimpleIcon from 'phosphor-svelte/lib/FolderSimpleIcon';
  import ChartLineUpIcon from 'phosphor-svelte/lib/ChartLineUpIcon';
  import GearSixIcon from 'phosphor-svelte/lib/GearSixIcon';
  import SignOutIcon from 'phosphor-svelte/lib/SignOutIcon';

  let { children }: { children?: import('svelte').Snippet } = $props();
  const nav = [
    { href: '/today', label: 'Today', icon: HouseIcon },
    { href: '/inbox', label: 'Inbox', icon: TrayIcon },
    { href: '/projects', label: 'Projects', icon: FolderSimpleIcon },
    { href: '/analytics', label: 'Analytics', icon: ChartLineUpIcon }
  ];

  async function signOut() {
    await logout();
    await goto('/login');
  }
</script>

<div class="min-h-screen bg-tk-paper lg:grid lg:grid-cols-[232px_1fr]">
  <aside class="hidden min-h-screen bg-tk-ink px-5 py-8 text-white lg:flex lg:flex-col">
    <Logo inverse class="h-7 w-auto" />
    <nav class="mt-16 space-y-2" aria-label="Primary navigation">
      {#each nav as item}
        <a
          href={item.href}
          class={cn(
            'flex h-12 items-center gap-3 rounded-[12px] px-4 text-[15px] font-medium transition hover:bg-white/5',
            page.url.pathname.startsWith(item.href) && 'bg-white/[0.07]'
          )}
        >
          <item.icon size={20} weight="regular" />
          {item.label}
        </a>
      {/each}
    </nav>
    <div class="mt-auto space-y-2">
      <a href="/settings" class="flex h-11 items-center gap-3 rounded-[12px] px-4 text-sm text-white/75 hover:bg-white/5 hover:text-white">
        <GearSixIcon size={19} /> Settings
      </a>
      <Button variant="ghost" class="w-full justify-start px-4 text-white/75 hover:bg-white/5 hover:text-white" onclick={signOut}>
        <SignOutIcon size={19} /> Sign out
      </Button>
    </div>
  </aside>

  <main class="min-w-0 pb-20 lg:pb-0">{@render children?.()}</main>

  <nav class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-tk-mist bg-white/95 px-2 py-2 backdrop-blur lg:hidden" aria-label="Mobile navigation">
    {#each nav as item}
      <a
        href={item.href}
        class={cn(
          'flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] text-tk-graphite',
          page.url.pathname.startsWith(item.href) && 'text-tk-ink'
        )}
      >
        <item.icon size={22} weight={page.url.pathname.startsWith(item.href) ? 'fill' : 'regular'} />
        {item.label}
      </a>
    {/each}
  </nav>
</div>
