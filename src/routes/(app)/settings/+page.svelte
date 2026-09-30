<script lang="ts">
  import GearSixIcon from 'phosphor-svelte/lib/GearSixIcon';
  import ProfileSettings from '$lib/components/settings/ProfileSettings.svelte';
  import PreferencesSettings from '$lib/components/settings/PreferencesSettings.svelte';
  import SessionsSettings from '$lib/components/settings/SessionsSettings.svelte';
  import DataPrivacySettings from '$lib/components/settings/DataPrivacySettings.svelte';
  import InstallAppCard from '$lib/components/pwa/InstallAppCard.svelte';

  const sections = [
    { href: '#profile', label: 'Profile' },
    { href: '#preferences', label: 'Preferences' },
    { href: '#devices', label: 'Devices' },
    { href: '#data', label: 'Data & privacy' },
    { href: '#app', label: 'App' }
  ];
</script>

<svelte:head><title>Settings — Taskiller</title></svelte:head>

<div class="mx-auto max-w-[1120px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
  <header class="border-b border-[var(--border)] pb-7">
    <div class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-tk-graphite"><GearSixIcon size={15} class="text-tk-strike" /> Account & behavior</div>
    <h1 class="tk-display text-5xl font-extrabold sm:text-6xl">Settings</h1>
    <p class="mt-3 max-w-2xl text-base leading-7 text-tk-graphite">Identity, focus defaults, active devices and the lifecycle of your Taskiller data—all backed by the same concurrency and security rules as the rest of the app.</p>
    <nav class="mt-6 flex flex-wrap gap-2" aria-label="Settings sections">
      {#each sections as section}
        <a class="rounded-full border border-[var(--border)] bg-white/70 px-3.5 py-2 text-xs font-bold text-tk-graphite transition hover:bg-white hover:text-tk-ink" href={section.href}>{section.label}</a>
      {/each}
    </nav>
  </header>

  <div class="mt-7 space-y-6">
    <ProfileSettings />
    <PreferencesSettings />
    <SessionsSettings />
    <DataPrivacySettings />
    <InstallAppCard />
  </div>
</div>
