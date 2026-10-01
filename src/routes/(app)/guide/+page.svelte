<script lang="ts">
  import InfoIcon from 'phosphor-svelte/lib/InfoIcon';
  import TrayIcon from 'phosphor-svelte/lib/TrayIcon';
  import TreeStructureIcon from 'phosphor-svelte/lib/TreeStructureIcon';
  import LightningIcon from 'phosphor-svelte/lib/LightningIcon';
  import ClockCountdownIcon from 'phosphor-svelte/lib/ClockCountdownIcon';
  import ChartLineUpIcon from 'phosphor-svelte/lib/ChartLineUpIcon';
  import ClockCounterClockwiseIcon from 'phosphor-svelte/lib/ClockCounterClockwiseIcon';
  import DevicesIcon from 'phosphor-svelte/lib/DevicesIcon';
  import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimpleIcon';
  import WifiSlashIcon from 'phosphor-svelte/lib/WifiSlashIcon';
  import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
  import SlidersHorizontalIcon from 'phosphor-svelte/lib/SlidersHorizontalIcon';

  let demoPaused = $state(false);
  let demoSegment = $state(1);

  const sections = [
    ['capture', 'Capture & Inbox'],
    ['hierarchy', 'Hierarchy'],
    ['planning', 'Plan & Start'],
    ['focus', 'Focus sessions'],
    ['review', 'Reviews & History'],
    ['analytics', 'Analytics'],
    ['account', 'Account & Devices'],
    ['data', 'Data & Privacy'],
    ['offline', 'PWA & Offline']
  ];
</script>

<svelte:head><title>Guide — Taskiller</title></svelte:head>

<div class="tk-page max-w-[1240px]">
  <header class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
    <div>
      <div class="mb-4 flex items-center gap-2 text-sm font-semibold text-tk-graphite"><InfoIcon size={17} class="text-tk-strike" /> App guide</div>
      <h1 class="tk-display max-w-[10ch] text-6xl font-extrabold sm:text-7xl">See the whole system.</h1>
      <p class="mt-5 max-w-2xl text-base leading-7 text-tk-graphite">A visual walkthrough from capture to execution, history, personalization, account security, and offline behavior.</p>
    </div>

    <div class="tk-panel rounded-[18px] p-4">
      <p class="text-xs font-bold text-tk-graphite">Guide sections</p>
      <nav class="mt-3 grid grid-cols-2 gap-1.5" aria-label="Guide sections">
        {#each sections as section}
          <a class="rounded-[9px] px-2.5 py-2 text-xs font-semibold text-tk-graphite transition-colors hover:bg-[var(--surface-subtle)] hover:text-tk-ink" href={`#${section[0]}`}>{section[1]}</a>
        {/each}
      </nav>
    </div>
  </header>

  <div class="mt-14 space-y-16">
    <section id="capture" class="scroll-mt-28 grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
      <div>
        <div class="flex items-center gap-2 text-sm font-semibold text-tk-graphite"><TrayIcon size={16} /> Capture & Inbox</div>
        <h2 class="tk-display mt-2 text-4xl font-bold">Get it out of your head first.</h2>
        <p class="mt-4 text-sm leading-7 text-tk-graphite">A Chore only needs a name. Add estimates, priority, deadlines, and structure later.</p>
        <a class="mt-5 inline-flex text-sm font-bold text-tk-strike" href="/inbox?capture=1">Open Inbox →</a>
      </div>
      <div class="tk-panel rounded-[20px] p-4">
        <div class="tk-capture-deck flex gap-2 rounded-[15px] p-2">
          <div class="flex h-11 flex-1 items-center rounded-[11px] px-3 text-sm text-tk-graphite">Draft onboarding notes…</div>
          <div class="grid h-11 place-items-center rounded-[11px] bg-tk-strike px-4 text-xs font-black text-[#24110b]">Capture</div>
        </div>
        <div class="mt-4 overflow-hidden rounded-[14px] border border-[var(--border)]">
          {#each [['Draft onboarding notes','draft'],['Prepare API smoke test','ready'],['Write launch checklist','in progress']] as item}
            <div class="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 last:border-b-0">
              <span class="text-sm font-semibold">{item[0]}</span>
              <span class="rounded-md bg-[var(--surface-subtle)] px-2 py-1 text-[10px] font-bold text-tk-graphite">{item[1]}</span>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <section id="hierarchy" class="scroll-mt-28 grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
      <div class="tk-panel rounded-[20px] p-5">
        <div class="flex items-center gap-3 rounded-[13px] bg-[var(--surface-subtle)] p-3"><TreeStructureIcon size={18} class="text-tk-blue" /><div><p class="text-xs text-tk-graphite">Project</p><p class="font-bold">Launch Taskiller</p></div></div>
        <div class="ml-5 mt-3 border-l border-[var(--border)] pl-5">
          <div class="rounded-[13px] bg-[var(--surface-subtle)] p-3"><p class="text-xs text-tk-graphite">Sprint</p><p class="font-bold">Production frontend</p></div>
          <div class="ml-7 mt-2 rounded-[13px] border border-tk-strike/20 bg-tk-strike/7 p-3"><p class="text-xs text-tk-graphite">Chore</p><p class="font-bold">Deploy and smoke test</p></div>
        </div>
      </div>
      <div>
        <div class="flex items-center gap-2 text-sm font-semibold text-tk-graphite"><TreeStructureIcon size={16} /> Hierarchy</div>
        <h2 class="tk-display mt-2 text-4xl font-bold">Project → Sprint → Chore.</h2>
        <p class="mt-4 text-sm leading-7 text-tk-graphite">Projects hold outcomes. Sprints group a push. Chores are executable. Chores can also live directly under Projects or in Inbox.</p>
        <a class="mt-5 inline-flex text-sm font-bold text-tk-strike" href="/projects">Open Projects →</a>
      </div>
    </section>

    <section id="planning" class="scroll-mt-28">
      <div class="max-w-2xl">
        <div class="flex items-center gap-2 text-sm font-semibold text-tk-graphite"><LightningIcon size={16} /> Plan & Start</div>
        <h2 class="tk-display mt-2 text-4xl font-bold">Turn work into a sequence.</h2>
        <p class="mt-4 text-sm leading-7 text-tk-graphite">Generate a recommendation or build from scratch. Reorder segments, change durations, link Sprint segments to Chores, save, then start.</p>
      </div>
      <div class="mt-6 grid gap-3 md:grid-cols-3">
        {#each [['Work','25 min','Linked Chore · Build form'],['Break','5 min','Short recovery'],['Review','Open','Close the loop']] as segment, index}
          <div class="tk-panel tk-lift rounded-[18px] p-4">
            <div class="flex items-center justify-between"><span class="tk-mono text-xs text-tk-graphite">0{index + 1}</span><span class="rounded-md bg-[var(--surface-subtle)] px-2 py-1 text-[10px] font-bold">{segment[1]}</span></div>
            <p class="mt-8 text-lg font-bold">{segment[0]}</p>
            <p class="mt-1 text-xs text-tk-graphite">{segment[2]}</p>
          </div>
        {/each}
      </div>
    </section>

    <section id="focus" class="scroll-mt-28 grid gap-7 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
      <div>
        <div class="flex items-center gap-2 text-sm font-semibold text-tk-graphite"><ClockCountdownIcon size={16} /> Focus session</div>
        <h2 class="tk-display mt-2 text-4xl font-bold">The plan becomes live state.</h2>
        <p class="mt-4 text-sm leading-7 text-tk-graphite">Pause/resume, start the next segment, complete or skip optional blocks, mark linked work complete, then finish or abandon while preserving history.</p>
      </div>
      <div class="tk-session-reactor rounded-[22px] p-6 text-white">
        <div class="flex items-center justify-between"><span class="text-sm font-semibold text-white/55">Demo session</span><span class="text-xs text-white/40">Segment {demoSegment} / 3</span></div>
        <div class="tk-mono mt-8 text-6xl font-semibold tracking-[-0.07em]">{demoPaused ? '24:18' : demoSegment === 1 ? '18:42' : '05:00'}</div>
        <div class="mt-7 h-1.5 overflow-hidden rounded-full bg-white/10"><div class="h-full rounded-full bg-tk-strike transition-[width] duration-300" style={`width:${demoSegment === 1 ? 58 : 82}%`}></div></div>
        <div class="mt-5 flex flex-wrap gap-2">
          <button class="rounded-[10px] bg-white/10 px-3 py-2 text-xs font-bold" onclick={() => (demoPaused = !demoPaused)}>{demoPaused ? 'Resume' : 'Pause'}</button>
          <button class="rounded-[10px] bg-tk-strike px-3 py-2 text-xs font-black text-[#24110b]" onclick={() => (demoSegment = Math.min(3, demoSegment + 1))}>Complete segment</button>
        </div>
      </div>
    </section>

    <section id="review" class="scroll-mt-28 grid gap-5 md:grid-cols-2">
      <div class="tk-panel rounded-[20px] p-5">
        <p class="text-sm font-semibold text-tk-graphite">Session review</p>
        <h2 class="mt-1 text-xl font-bold">Capture the signal.</h2>
        <div class="mt-5 grid grid-cols-5 gap-2">{#each [1,2,3,4,5] as score}<span class="grid h-10 place-items-center rounded-[9px] border border-[var(--border)] text-xs font-bold {score === 4 ? 'bg-tk-strike text-[#24110b] border-tk-strike' : ''}">{score}</span>{/each}</div>
        <p class="mt-4 text-xs leading-5 text-tk-graphite">Focus, fatigue, difficulty, satisfaction, and notes are optional.</p>
      </div>
      <div class="tk-panel rounded-[20px] p-5">
        <div class="flex items-center gap-2 text-sm font-semibold text-tk-graphite"><ClockCounterClockwiseIcon size={16} /> History</div>
        <h2 class="mt-1 text-xl font-bold">Every session stays inspectable.</h2>
        <div class="mt-5 space-y-2">
          {#each [['Production frontend','42 min','Completed'],['API deployment','28 min','Completed'],['Documentation','16 min','Abandoned']] as row}
            <div class="flex items-center justify-between rounded-[11px] bg-[var(--surface-subtle)] p-3"><div><p class="text-sm font-bold">{row[0]}</p><p class="text-xs text-tk-graphite">{row[1]}</p></div><span class="text-[10px] font-bold text-tk-graphite">{row[2]}</span></div>
          {/each}
        </div>
      </div>
    </section>

    <section id="analytics" class="scroll-mt-28">
      <div class="flex items-center gap-2 text-sm font-semibold text-tk-graphite"><ChartLineUpIcon size={16} /> Analytics</div>
      <h2 class="tk-display mt-2 text-4xl font-bold">Observe patterns without grading yourself.</h2>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-tk-graphite">Active time, breaks, pauses, completion, adherence, estimate error, start delay, work-type patterns, and review-based focus signals.</p>
      <div class="mt-6 tk-panel rounded-[20px] p-5">
        <div class="flex h-44 items-end gap-2">
          {#each [35,60,45,78,52,88,68,42,74,90,58,70] as height, index}
            <div class="flex-1 rounded-t-[6px] bg-tk-strike/85" style={`height:${height}%`} title={`Example bucket ${index + 1}`}></div>
          {/each}
        </div>
        <div class="mt-3 flex justify-between text-[10px] text-tk-graphite"><span>Earlier</span><span>Observed active work</span><span>Recent</span></div>
      </div>
    </section>

    <section id="account" class="scroll-mt-28 grid gap-5 md:grid-cols-2">
      <div class="tk-panel rounded-[20px] p-5">
        <div class="flex items-center gap-2 text-sm font-semibold text-tk-graphite"><EnvelopeSimpleIcon size={16} /> Account recovery</div>
        <h2 class="mt-1 text-xl font-bold">Verify and recover safely.</h2>
        <p class="mt-3 text-sm leading-6 text-tk-graphite">Verify email, request password reset, and revoke old sessions when a password changes.</p>
      </div>
      <div class="tk-panel rounded-[20px] p-5">
        <div class="flex items-center gap-2 text-sm font-semibold text-tk-graphite"><DevicesIcon size={16} /> Devices</div>
        <h2 class="mt-1 text-xl font-bold">See where you are signed in.</h2>
        <p class="mt-3 text-sm leading-6 text-tk-graphite">Revoke one device, the current device, or all active sessions from Settings.</p>
      </div>
    </section>

    <section id="data" class="scroll-mt-28 grid gap-5 md:grid-cols-2">
      <div class="tk-panel rounded-[20px] p-5">
        <div class="flex items-center gap-2 text-sm font-semibold text-tk-graphite"><DownloadSimpleIcon size={16} /> Export</div>
        <h2 class="mt-1 text-xl font-bold">Take your data with you.</h2>
        <p class="mt-3 text-sm leading-6 text-tk-graphite">Request a compressed JSON archive and watch it move from queued to processing to ready.</p>
      </div>
      <div class="tk-danger-zone rounded-[20px] p-5">
        <p class="text-sm font-semibold">Account deletion</p>
        <h2 class="mt-1 text-xl font-bold">Destructive actions stay explicit.</h2>
        <p class="tk-danger-muted mt-3 text-sm leading-6">Deletion immediately revokes sessions, then the backend waits through the configured grace period before hard deletion.</p>
      </div>
    </section>

    <section id="offline" class="scroll-mt-28 grid gap-5 md:grid-cols-2">
      <div class="tk-panel rounded-[20px] p-5">
        <div class="flex items-center gap-2 text-sm font-semibold text-tk-graphite"><WifiSlashIcon size={16} /> Offline</div>
        <h2 class="mt-1 text-xl font-bold">Read safely. Don’t fake writes.</h2>
        <p class="mt-3 text-sm leading-6 text-tk-graphite">The PWA recovers its shell and visited navigation offline. Mutations wait for a real connection so ETags and idempotency stay correct.</p>
      </div>
      <div class="tk-panel rounded-[20px] p-5">
        <div class="flex items-center gap-2 text-sm font-semibold text-tk-graphite"><SlidersHorizontalIcon size={16} /> Appearance & install</div>
        <h2 class="mt-1 text-xl font-bold">Light, dark, system, and installable.</h2>
        <p class="mt-3 text-sm leading-6 text-tk-graphite">Theme applies before the app paints, including the loading screen and installed PWA.</p>
      </div>
    </section>
  </div>

  <footer class="mt-16 border-t border-[var(--border)] pt-7"><a href="/today" class="text-sm font-bold text-tk-strike">Return to Today →</a></footer>
</div>
