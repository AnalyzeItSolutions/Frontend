import { LegalLayout } from '../Components/legal/LegalLayout';
import { ExtensionInstall } from '../Components/extension/ExtensionInstall';
import { ExtensionAccountLink } from '../Components/extension/ExtensionAccountLink';
import { STORES_CONFIG } from '../lib/extensionStores.mjs';

const h2 = 'mt-10 text-xl font-semibold text-[var(--text-primary)]';
const p = 'mt-3 text-[var(--text-secondary)] leading-relaxed';

export default function ExtensionPage() {
  const files = Object.values(STORES_CONFIG.packages);
  return (
    <LegalLayout title="The AnalyzeIt browser extension" eyebrow={false} showHeroUpdated={false} quietOperator
      subtitle="Your assistant suggests a post, you edit and approve it, and the extension puts it in your own browser. You stay in control at every step.">
      <h2 className={h2}>Get it</h2>
      <ExtensionInstall />

      <h2 className={h2}>Use it from Claude or ChatGPT online</h2>
      <ExtensionAccountLink />

      <h2 className={h2}>What it does, and what it won’t</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-[var(--text-secondary)]">
        <li>Opens a site you allowed, puts the exact text you approved in the box and, only if you chose “Post it for me”, presses Post once.</li>
        <li>Shows its own window with every step and the exact text before anything runs.</li>
        <li>Never fills passwords, one-time codes or payment details, never clicks buy, delete or follow style buttons, and stops if a page asks you to sign in.</li>
        <li>Has daily limits per site and a Stop everything switch.</li>
        <li>Works only while your browser is open: there is no scheduled posting.</li>
        <li>If you link it to your account, assistants you connected to AnalyzeIt can work in it step by step, under these same rules. Unlink here or in the extension at any time.</li>
      </ul>

      <h2 className={h2}>Checksums</h2>
      <p className={p}>Verify a download with <a className="underline" href="/extension/SHA256SUMS">SHA256SUMS</a> (<code>shasum -a 256 -c SHA256SUMS</code>). Packages: {files.join(', ')}.</p>

      <h2 id="privacy" className={h2}>Privacy</h2>
      <p className={p}><strong>The extension collects no data and makes no network requests of its own unless you link it to your AnalyzeIt account.</strong> Once linked, it keeps one connection open to AnalyzeIt to receive the steps your connected assistants ask for, and sends back what each step returned (the page’s visible text and the names of its buttons, links and fields, never what is typed in form fields or password, code and card fields; or a screenshot you allowed). AnalyzeIt passes these on to that assistant and deletes them as soon as it has read them (at most 15 minutes).</p>
      <p className={p}>The text and steps you approve arrive from the AnalyzeIt page open in your browser and are held only in memory while they run. If you approve a step that reads a page, the extension strips form values, password fields and long digit runs and hands the text back to that same AnalyzeIt page; AnalyzeIt may keep it with your plan as described in the <a className="underline" href="/privacy">Privacy Policy</a>.</p>
      <p className={p}>Your daily limits, pauses and a log of recent actions (time, step type, site, outcome, and the length of a post, never its text) stay in your browser. It handles no passwords, codes, payment details, cookies or browsing history, and acts only on sites you allow, one at a time, in your browser’s own prompt. No analytics, no advertising, no remote code.</p>
    </LegalLayout>
  );
}
