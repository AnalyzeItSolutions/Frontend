'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ARCH_LABELS, KIND_LABELS, OS_LIST, detectArch, detectOs, filesFor, formatSize, primaryFile } from '../lib/downloads.mjs';

type RFile = { os: string; arch: string; kind: string; name: string; url: string; sha256: string; size: number };
type Releases = { desktop?: { version: string; pub_date?: string; notes?: string; files: RFile[] }; cli?: { version: string; files: RFile[] } } | null;

const OS_NOTES: Record<string, { title: string; steps: string[] }> = {
  macos: {
    title: 'Opening it for the first time on macOS',
    steps: [
      'Open the .dmg and drag AnalyzeIt to Applications.',
      'The first launch may say the app is from an unidentified developer. Right-click (or Control-click) AnalyzeIt, choose Open, then Open again. You only do this once.',
      'Not sure which Mac you have? Apple menu → About This Mac. “Chip: Apple M…” means Apple silicon; “Processor: Intel” means Intel.',
    ],
  },
  windows: {
    title: 'Opening it for the first time on Windows',
    steps: [
      'Run the installer. If Windows SmartScreen says it protected your PC, choose More info → Run anyway. This appears for new publishers and goes away as the app becomes established.',
      'The app installs for your user and updates itself afterwards.',
    ],
  },
  linux: {
    title: 'Running it on Linux',
    steps: [
      'AppImage: make it executable (chmod +x AnalyzeIt*.AppImage) and run it. It works on most distributions.',
      'Debian or Ubuntu: sudo apt install ./AnalyzeIt*.deb. Fedora or RHEL: sudo dnf install ./AnalyzeIt*.rpm.',
    ],
  },
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard may be unavailable */
        }
      }}
      className="text-[11px] font-mono uppercase tracking-wider text-[#E4E4E2] hover:text-[#E4E4E2]"
    >
      {done ? 'Copied' : label}
    </button>
  );
}

function Command({ title, hint, command }: { title: string; hint: string; command: string }) {
  return (
    <div className="rounded-xl border border-[#E4E4E2]/25 bg-[#414141]/[0.06] dark:bg-white/[0.05] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-semibold text-[#262626] dark:text-[#E5E5E5]">{title}</div>
        <CopyButton text={command} label="Copy command" />
      </div>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-black/80 p-3 text-xs leading-relaxed text-[#E4E4E2]"><code>{command}</code></pre>
      <p className="mt-2 text-xs text-[#414141]/70 dark:text-[#888888]">{hint}</p>
    </div>
  );
}

export function DownloadClient({ releases }: { releases: Releases }) {
  const [os, setOs] = useState<string>('macos');
  const [arch, setArch] = useState<string>('arm64');
  const [detected, setDetected] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const found = detectOs(navigator.userAgent, navigator.platform);
    setDetected(found);
    if (found) setOs(found);
    // Chromium can say whether a Mac is Apple silicon; other browsers cannot, so we default and let people choose.
    const uaData = (navigator as unknown as { userAgentData?: { getHighEntropyValues?: (k: string[]) => Promise<{ architecture?: string }> } }).userAgentData;
    if (found === 'macos' && uaData?.getHighEntropyValues) {
      uaData.getHighEntropyValues(['architecture']).then((v) => setArch(detectArch('macos', v.architecture || ''))).catch(() => setArch(detectArch('macos')));
    } else {
      setArch(detectArch(found || 'macos'));
    }
  }, []);

  const desktop = releases?.desktop;
  const cli = releases?.cli;
  const primary = useMemo(() => primaryFile(releases, 'desktop', os, arch), [releases, os, arch]);
  const desktopFiles: RFile[] = useMemo(() => filesFor(releases, 'desktop', os, arch), [releases, os, arch]);
  const cliFile: RFile | null = useMemo(() => primaryFile(releases, 'cli', os, arch), [releases, os, arch]);
  const osLabel = OS_LIST.find((o) => o.id === os)?.label || '';

  if (!desktop && !cli) {
    return (
      <div className="rounded-2xl border border-[#E4E4E2]/25 bg-white/60 dark:bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-[#262626] dark:text-[#E5E5E5]">Downloads are being prepared</h2>
        <p className="mt-2 text-sm">The first release is not published yet. Please check back soon, or <a className="text-[#E4E4E2] hover:underline" href="/contact">contact us</a>.</p>
      </div>
    );
  }

  return (
    <div className="not-prose space-y-10">
      {/* One-line install: the main way */}
      <section className="rounded-2xl border border-[#E4E4E2]/25 bg-white/60 dark:bg-white/[0.03] p-6 sm:p-8">
        <div className="font-mono text-xs uppercase tracking-wider text-[#414141]/50 dark:text-[#888888]">{detected ? `Detected: ${osLabel}` : 'Install'} · copy, paste, done</div>
        <h2 className="mt-1 text-xl font-semibold text-[#262626] dark:text-[#E5E5E5]">Install AnalyzeIt with one line</h2>
        <p className="mt-2 text-sm text-[#414141]/80 dark:text-[#BABABA]">
          {os === 'windows' ? 'Open PowerShell' : 'Open Terminal'}, paste a line, press Enter. It picks the right build for your computer, checks its SHA-256 and installs it.
          No browser download, so no &ldquo;unidentified developer&rdquo; or SmartScreen warning. {desktop || cli ? <>Latest: app {desktop?.version ?? '—'}, command line {cli?.version ?? '—'}.</> : null}
        </p>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Operating system">
          {OS_LIST.map((o) => (
            <button
              key={o.id}
              role="tab"
              aria-selected={os === o.id}
              type="button"
              onClick={() => { setOs(o.id); if (o.id !== 'macos') setArch('x64'); }}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${os === o.id ? 'border-[#E4E4E2] bg-[var(--brand)]/15 text-[#262626] dark:text-[#E5E5E5] font-semibold' : 'border-[#414141]/15 dark:border-[#262626] hover:border-[#E4E4E2]/60'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-4">
          {os === 'windows' ? (
            <>
              <Command title="Desktop app" hint="Installs for your user only. No administrator rights needed." command={'& ([scriptblock]::Create((irm https://www.analyzeit.si/install.ps1))) -App'} />
              <Command title="Command line" hint="Then run analyzeit login. It opens your browser." command={'irm https://www.analyzeit.si/install.ps1 | iex'} />
            </>
          ) : (
            <>
              <Command title="Desktop app" hint={os === 'macos' ? 'Installs AnalyzeIt.app into Applications.' : 'Installs the AppImage into ~/.local/bin.'} command={'curl -fsSL https://www.analyzeit.si/install.sh | sh -s -- --app'} />
              <Command title="Command line" hint="Then run analyzeit login. Update any time with analyzeit update." command={'curl -fsSL https://www.analyzeit.si/install.sh | sh'} />
            </>
          )}
        </div>
        <p className="mt-4 text-xs text-[#414141]/70 dark:text-[#888888]">
          Read the script first at <a className="text-[#E4E4E2] hover:underline" href="/install.sh">/install.sh</a> or <a className="text-[#E4E4E2] hover:underline" href="/install.ps1">/install.ps1</a>. Updates afterwards are signed and verified by the program itself.
        </p>
      </section>

      <details className="group rounded-2xl border border-[#414141]/10 dark:border-[#262626] p-6">
        <summary className="cursor-pointer text-base font-semibold text-[#262626] dark:text-[#E5E5E5]">Prefer a file download instead?</summary>
        <div className="mt-6 space-y-10">
      {/* Manual selection */}
      <section>
        <p className="text-sm text-[#414141]/75 dark:text-[#BABABA]">Browser downloads may show a first-run warning (see below). System: <strong>{osLabel}</strong>, chosen above.</p>
        {os === 'macos' ? (
          <div role="radiogroup" aria-label="Mac processor" className="mt-3 flex flex-wrap gap-2">
            {(['arm64', 'x64'] as const).map((a) => (
              <button
                key={a}
                role="radio"
                aria-checked={arch === a}
                type="button"
                onClick={() => setArch(a)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${arch === a ? 'border-[#E4E4E2] bg-[var(--brand)]/10 font-semibold' : 'border-[#414141]/15 dark:border-[#262626] hover:border-[#E4E4E2]/60'}`}
              >
                {ARCH_LABELS[a]}
              </button>
            ))}
          </div>
        ) : null}

        <h3 className="mt-6 text-sm font-semibold text-[#262626] dark:text-[#E5E5E5]">Desktop app{desktop ? ` ${desktop.version}` : ''}</h3>
        {desktopFiles.length ? (
          <ul className="mt-2 divide-y divide-[#414141]/10 dark:divide-[#262626] rounded-xl border border-[#414141]/10 dark:border-[#262626]">
            {desktopFiles.map((f) => (
              <li key={f.name} className="p-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[#262626] dark:text-[#E5E5E5]">{KIND_LABELS[f.kind as keyof typeof KIND_LABELS] || f.kind}</div>
                    <div className="font-mono text-[11px] text-[#414141]/60 dark:text-[#888888]">{f.name} · {formatSize(f.size)}</div>
                  </div>
                  <a href={f.url} className="rounded-lg border border-[#E4E4E2]/50 px-4 py-1.5 text-sm hover:bg-[var(--brand)]/10">Download</a>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#414141]/60 dark:text-[#888888]">
                  <span className="break-all">SHA-256 {f.sha256}</span>
                  <CopyButton text={f.sha256} label="Copy" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#414141]/70 dark:text-[#888888]">No desktop installer for this system yet.</p>
        )}

        <h3 className="mt-8 text-sm font-semibold text-[#262626] dark:text-[#E5E5E5]">Command line{cli ? ` ${cli.version}` : ''}</h3>
        {cliFile ? (
          <div className="mt-2 rounded-xl border border-[#414141]/10 dark:border-[#262626] p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-[11px] text-[#414141]/60 dark:text-[#888888]">{cliFile.name} · {formatSize(cliFile.size)}</div>
              <a href={cliFile.url} className="rounded-lg border border-[#E4E4E2]/50 px-4 py-1.5 text-sm hover:bg-[var(--brand)]/10">Download</a>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#414141]/60 dark:text-[#888888]">
              <span className="break-all">SHA-256 {cliFile.sha256}</span>
              <CopyButton text={cliFile.sha256} label="Copy" />
            </div>
            <pre className="overflow-x-auto rounded-lg bg-[#414141]/[0.06] dark:bg-white/[0.05] p-3 text-xs leading-relaxed">{os === 'windows'
              ? `# In PowerShell, from the folder you downloaded it to\nRename-Item ${cliFile.name} analyzeit.exe\n.\\analyzeit.exe login      # opens your browser`
              : `chmod +x ${cliFile.name}\nsudo mv ${cliFile.name} /usr/local/bin/analyzeit\nanalyzeit login            # opens your browser\nanalyzeit update           # keeps it current`}</pre>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#414141]/70 dark:text-[#888888]">No command-line build for this system yet.</p>
        )}
      </section>

      {/* First-run help */}
      <section className="rounded-2xl border border-[#414141]/10 dark:border-[#262626] p-6">
        <h2 className="text-base font-semibold text-[#262626] dark:text-[#E5E5E5]">{OS_NOTES[os].title}</h2>
        <ul className="mt-3 list-disc pl-5 space-y-2 text-sm text-[#414141]/80 dark:text-[#BABABA]">
          {OS_NOTES[os].steps.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </section>

        </div>
      </details>

      {/* Trust */}
      <section className="grid gap-4 sm:grid-cols-3 text-sm">
        {[
          ['Private by design', 'Files you import stay on your computer in an encrypted vault. Nothing is uploaded unless you ask the online assistant, and then only a column summary you allowed, never your rows.'],
          ['Signed updates', 'The app checks for updates itself. Every update is signed with our key and verified before it is installed, so a tampered file is rejected.'],
          ['Verify your download', 'Each file lists its SHA-256. Compare it with `shasum -a 256 <file>` (macOS, Linux) or `Get-FileHash <file>` (Windows).'],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-[#414141]/10 dark:border-[#262626] p-4">
            <div className="font-semibold text-[#262626] dark:text-[#E5E5E5]">{t}</div>
            <p className="mt-1 text-[#414141]/75 dark:text-[#BABABA]">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
