<script lang="ts">
  import GearSixIcon from 'phosphor-svelte/lib/GearSixIcon';
  import AppearanceSettings from '$lib/components/theme/AppearanceSettings.svelte';
  import ProfileSettings from '$lib/components/settings/ProfileSettings.svelte';
  import PreferencesSettings from '$lib/components/settings/PreferencesSettings.svelte';
  import SessionsSettings from '$lib/components/settings/SessionsSettings.svelte';
  import DataPrivacySettings from '$lib/components/settings/DataPrivacySettings.svelte';
  import InstallAppCard from '$lib/components/pwa/InstallAppCard.svelte';

  const sections = [
    { href: '#appearance', label: 'Appearance' },
    { href: '#profile', label: 'Profile' },
    { href: '#preferences', label: 'Preferences' },
    { href: '#devices', label: 'Devices' },
    { href: '#data', label: 'Data & privacy' },
    { href: '#app', label: 'App' }
  ];
</script>

<svelte:head><title>Settings — Taskiller</title></svelte:head>

<div class="tk-page max-w-[1180px]">
  <header>
    <div class="mb-4 flex items-center gap-2 text-sm font-semibold text-tk-graphite"><GearSixIcon size={16} class="text-tk-strike" /> Tune the workspace</div>
    <h1 class="tk-display text-6xl font-extrabold sm:text-7xl">Settings</h1>
    <p class="mt-4 max-w-2xl text-base leading-7 text-tk-graphite">Appearance, behavior, devices, and the lifecycle of your Taskiller data.</p>

    <nav class="mt-7 flex flex-wrap gap-2" aria-label="Settings sections">
      {#each sections as section}
        <a class="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-tk-graphite transition-[transform,border-color,color] hover:-translate-y-px hover:border-[var(--border-strong)] hover:text-tk-ink" href={section.href}>
          {section.label}
        </a>
      {/each}
    </nav>
  </header>

  <div class="mt-8 space-y-6">
    <AppearanceSettings />
    <ProfileSettings />
    <PreferencesSettings />
    <SessionsSettings />
    <DataPrivacySettings />
    <InstallAppCard />
  </div>
</div>
