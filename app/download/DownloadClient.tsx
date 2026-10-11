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
      className="text-[11px] font-mono uppercase tracking-wider text-[#E3836C] hover:text-[#ED967F]"
    >
      {done ? 'Copied' : label}
    </button>
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
      <div className="rounded-2xl border border-[#E3836C]/25 bg-white/60 dark:bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-[#2B2620] dark:text-[#EDE6DD]">Downloads are being prepared</h2>
        <p className="mt-2 text-sm">The first release is not published yet. Please check back soon, or <a className="text-[#E3836C] hover:underline" href="/contact">contact us</a>.</p>
      </div>
    );
  }

  return (
    <div className="not-prose space-y-10">
      {/* Recommended */}
      <section className="rounded-2xl border border-[#E3836C]/25 bg-white/60 dark:bg-white/[0.03] p-6 sm:p-8">
        {detected === null ? (
          <p className="text-sm">AnalyzeIt for desktop runs on computers. Pick your system below, or open this page on your Mac, Windows or Linux computer.</p>
        ) : null}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-[#4A4238]/50 dark:text-[#91867E]">{detected ? 'Recommended for your computer' : 'Selected'}</div>
            <h2 className="mt-1 text-xl font-semibold text-[#2B2620] dark:text-[#EDE6DD]">
              AnalyzeIt for {osLabel}{os === 'macos' ? ` · ${ARCH_LABELS[arch as keyof typeof ARCH_LABELS]}` : ''}
            </h2>
            {desktop ? <p className="mt-1 text-sm text-[#4A4238]/70 dark:text-[#91867E]">Version {desktop.version}{primary ? ` · ${formatSize(primary.size)}` : ''}</p> : null}
          </div>
          {primary ? (
            <a href={primary.url} className="inline-flex items-center justify-center rounded-lg bg-[#E3836C] px-6 py-3 text-sm font-semibold text-[#1a0f0b] hover:bg-[#ED967F]">
              Download for {osLabel}
            </a>
          ) : (
            <span className="text-sm text-[#4A4238]/70 dark:text-[#91867E]">Not available for this system yet.</span>
          )}
        </div>
      </section>

      {/* Manual selection */}
      <section aria-labelledby="choose">
        <h2 id="choose" className="text-lg font-semibold text-[#2B2620] dark:text-[#EDE6DD]">Choose your system</h2>
        <div role="tablist" aria-label="Operating system" className="mt-3 flex flex-wrap gap-2">
          {OS_LIST.map((o) => (
            <button
              key={o.id}
              role="tab"
              aria-selected={os === o.id}
              type="button"
              onClick={() => { setOs(o.id); if (o.id !== 'macos') setArch('x64'); }}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${os === o.id ? 'border-[#E3836C] bg-[#E3836C]/15 text-[#2B2620] dark:text-[#EDE6DD] font-semibold' : 'border-[#4A4238]/15 dark:border-[#3A3430] hover:border-[#E3836C]/60'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {os === 'macos' ? (
          <div role="radiogroup" aria-label="Mac processor" className="mt-3 flex flex-wrap gap-2">
            {(['arm64', 'x64'] as const).map((a) => (
              <button
                key={a}
                role="radio"
                aria-checked={arch === a}
                type="button"
                onClick={() => setArch(a)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${arch === a ? 'border-[#E3836C] bg-[#E3836C]/10 font-semibold' : 'border-[#4A4238]/15 dark:border-[#3A3430] hover:border-[#E3836C]/60'}`}
              >
                {ARCH_LABELS[a]}
              </button>
            ))}
          </div>
        ) : null}

        <h3 className="mt-6 text-sm font-semibold text-[#2B2620] dark:text-[#EDE6DD]">Desktop app{desktop ? ` ${desktop.version}` : ''}</h3>
        {desktopFiles.length ? (
          <ul className="mt-2 divide-y divide-[#4A4238]/10 dark:divide-[#3A3430] rounded-xl border border-[#4A4238]/10 dark:border-[#3A3430]">
            {desktopFiles.map((f) => (
              <li key={f.name} className="p-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[#2B2620] dark:text-[#EDE6DD]">{KIND_LABELS[f.kind as keyof typeof KIND_LABELS] || f.kind}</div>
                    <div className="font-mono text-[11px] text-[#4A4238]/60 dark:text-[#91867E]">{f.name} · {formatSize(f.size)}</div>
                  </div>
                  <a href={f.url} className="rounded-lg border border-[#E3836C]/50 px-4 py-1.5 text-sm hover:bg-[#E3836C]/10">Download</a>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#4A4238]/60 dark:text-[#91867E]">
                  <span className="break-all">SHA-256 {f.sha256}</span>
                  <CopyButton text={f.sha256} label="Copy" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">No desktop installer for this system yet.</p>
        )}

        <h3 className="mt-8 text-sm font-semibold text-[#2B2620] dark:text-[#EDE6DD]">Command line{cli ? ` ${cli.version}` : ''}</h3>
        {cliFile ? (
          <div className="mt-2 rounded-xl border border-[#4A4238]/10 dark:border-[#3A3430] p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-[11px] text-[#4A4238]/60 dark:text-[#91867E]">{cliFile.name} · {formatSize(cliFile.size)}</div>
              <a href={cliFile.url} className="rounded-lg border border-[#E3836C]/50 px-4 py-1.5 text-sm hover:bg-[#E3836C]/10">Download</a>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#4A4238]/60 dark:text-[#91867E]">
              <span className="break-all">SHA-256 {cliFile.sha256}</span>
              <CopyButton text={cliFile.sha256} label="Copy" />
            </div>
            <pre className="overflow-x-auto rounded-lg bg-[#4A4238]/[0.06] dark:bg-white/[0.05] p-3 text-xs leading-relaxed">{os === 'windows'
              ? `# In PowerShell, from the folder you downloaded it to\nRename-Item ${cliFile.name} analyzeit.exe\n.\\analyzeit.exe login      # opens your browser`
              : `chmod +x ${cliFile.name}\nsudo mv ${cliFile.name} /usr/local/bin/analyzeit\nanalyzeit login            # opens your browser\nanalyzeit update           # keeps it current`}</pre>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#4A4238]/70 dark:text-[#91867E]">No command-line build for this system yet.</p>
        )}
      </section>

      {/* Terminal install: no first-run warning */}
      <section className="rounded-2xl border border-[#4A4238]/10 dark:border-[#3A3430] p-6">
        <h2 className="text-base font-semibold text-[#2B2620] dark:text-[#EDE6DD]">Install from a terminal (no first-run warning)</h2>
        <p className="mt-2 text-sm text-[#4A4238]/80 dark:text-[#C5B9AE]">
          Files saved by a browser are flagged &ldquo;downloaded from the internet&rdquo;, which is what triggers the unidentified-developer warning. Files fetched by these commands are not flagged, so
          nothing is blocked. The script checks the SHA-256 before installing, and you can read it first at <a className="text-[#E3836C] hover:underline" href="/install.sh">/install.sh</a> or <a className="text-[#E3836C] hover:underline" href="/install.ps1">/install.ps1</a>.
        </p>
        {os === 'windows' ? (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-[#4A4238]/[0.06] dark:bg-white/[0.05] p-3 text-xs leading-relaxed">{`# Command line
irm https://www.analyzeit.in/install.ps1 | iex

# Desktop app
& ([scriptblock]::Create((irm https://www.analyzeit.in/install.ps1))) -App`}</pre>
        ) : (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-[#4A4238]/[0.06] dark:bg-white/[0.05] p-3 text-xs leading-relaxed">{`# Command line
curl -fsSL https://www.analyzeit.in/install.sh | sh

# Desktop app
curl -fsSL https://www.analyzeit.in/install.sh | sh -s -- --app`}</pre>
        )}
      </section>

      {/* First-run help */}
      <section className="rounded-2xl border border-[#4A4238]/10 dark:border-[#3A3430] p-6">
        <h2 className="text-base font-semibold text-[#2B2620] dark:text-[#EDE6DD]">{OS_NOTES[os].title}</h2>
        <ul className="mt-3 list-disc pl-5 space-y-2 text-sm text-[#4A4238]/80 dark:text-[#C5B9AE]">
          {OS_NOTES[os].steps.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </section>

      {/* Trust */}
      <section className="grid gap-4 sm:grid-cols-3 text-sm">
        {[
          ['Private by design', 'Files you import stay on your computer in an encrypted vault. Nothing is uploaded unless you ask the online assistant, and then only a column summary you allowed, never your rows.'],
          ['Signed updates', 'The app checks for updates itself. Every update is signed with our key and verified before it is installed, so a tampered file is rejected.'],
          ['Verify your download', 'Each file lists its SHA-256. Compare it with `shasum -a 256 <file>` (macOS, Linux) or `Get-FileHash <file>` (Windows).'],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-[#4A4238]/10 dark:border-[#3A3430] p-4">
            <div className="font-semibold text-[#2B2620] dark:text-[#EDE6DD]">{t}</div>
            <p className="mt-1 text-[#4A4238]/75 dark:text-[#C5B9AE]">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
