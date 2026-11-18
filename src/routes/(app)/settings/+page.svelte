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
  <header class="tk-page-intro">
    <div class="tk-eyebrow mb-4 flex items-center gap-2 text-sm font-semibold text-tk-graphite"><span class="tk-feature-icon" aria-hidden="true"><GearSixIcon size={16} class="text-tk-strike" aria-hidden="true" /></span> Tune the workspace</div>
    <h1 class="tk-display text-6xl font-extrabold sm:text-7xl">Settings</h1>
    <p class="mt-4 max-w-2xl text-base leading-7 text-tk-graphite">Appearance, behavior, devices, and the lifecycle of your Taskiller data.</p>

  </header>

  <div class="settings-composition mt-8">
    <nav class="settings-nav tk-panel flex flex-wrap gap-2 p-3" aria-label="Settings sections">
      {#each sections as section}
        <a class="settings-link flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-tk-graphite" href={section.href}>
          <span class="size-2 rounded-full bg-[var(--blue)]" aria-hidden="true"></span>{section.label}
        </a>
      {/each}
    </nav>

  <div class="min-w-0 space-y-6">
    <AppearanceSettings />
    <ProfileSettings />
    <PreferencesSettings />
    <SessionsSettings />
    <DataPrivacySettings />
    <InstallAppCard />
  </div>
  </div>
</div>

<style>


  .settings-composition { display: grid; gap: 28px; align-items: start; }
  .settings-nav { border-radius: 22px; }
  .settings-link { transition: background-color 220ms, color 220ms, transform 220ms; }
  .settings-link:hover, .settings-link:focus-visible { background: var(--accent-soft); color: var(--accent-ink); transform: translateX(3px); }
  @media (min-width: 1024px) { .settings-composition { grid-template-columns: 210px minmax(0, 1fr); } .settings-nav { position: sticky; top: 100px; flex-direction: column; } }
  @media (prefers-reduced-motion: reduce) { .settings-link { transition: none; } .settings-link:hover, .settings-link:focus-visible { transform: none; } }

</style>
