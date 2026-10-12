import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '../../Components/docs/DocPage';

export const metadata: Metadata = {
  title: 'Connect an AI assistant to AnalyzeIt — AnalyzeIt',
  description: 'Use ChatGPT, Claude, Grok, Cursor or any assistant that supports remote MCP servers on your AnalyzeIt data. One sign-in on this site, read-only, and you choose what it can see.',
  alternates: { canonical: '/docs/connect-assistant' },
};

const MCP_URL = 'https://backend-qwiq.onrender.com/mcp';

export default function Page() {
  return (
    <DocPage title="Connect an AI assistant" subtitle="Use the assistant you already pay for on your AnalyzeIt data, without handing it your account.">
      <h2>How it works</h2>
      <p>
        Add AnalyzeIt to your assistant as a connector (an “MCP server”) using the address below. The first time you use it, a browser window opens on this site. You sign in the way you normally do
        (password, Google or GitHub), see exactly which app is asking, and choose Allow. The window sends you back to your assistant, which is now connected.
      </p>
      <p><code>{MCP_URL}</code></p>

      <h2>Add it to your assistant</h2>
      <ul>
        <li><strong>Claude</strong>: Settings → Connectors → add a custom connector, paste the address. In Claude Code: <code>claude mcp add --transport http analyzeit {MCP_URL}</code>, then run <code>/mcp</code> and choose Authenticate.</li>
        <li><strong>ChatGPT</strong>: add a custom connector (MCP server) in Settings → Connectors, paste the address and choose OAuth. Custom connectors may need Developer mode or a plan that includes them.</li>
        <li><strong>Grok, Cursor, VS Code, Windsurf and others</strong>: wherever the app asks for a remote MCP server URL, paste the address and choose sign-in (OAuth) if asked.</li>
      </ul>
      <p>Menu names change between versions. What you need is an assistant that supports remote MCP servers with sign-in; the address and the browser approval are the same everywhere.</p>

      <h2>What the assistant can do</h2>
      <ul>
        <li><strong>Read, once you allow it.</strong> It can list your projects and tables, read rows, compute exact totals and groupings, and see which connectors are set up and when they last synced. Each project has an AI data access setting that starts off; the assistant cannot turn it on itself.</li>
        <li><strong>Ask for access.</strong> It sends you a snapshot of what it wants to read (tables, fields, how many records) and a link. You choose which tables to allow, or decline.</li>
        <li><strong>Suggest changes.</strong> It shows you the exact before and after for the records it wants to update or delete. Nothing changes until you approve, and you can undo for 30 days. Tables synced from a connector cannot be edited this way.</li>
        <li><strong>Start a connection.</strong> Any source AnalyzeIt supports can be set up from the chat: the assistant gives you a link to the AnalyzeIt website where you sign in to the provider or enter your details. Passwords and keys never pass through the chat, and the assistant has no way to receive them.</li>
        <li>It never sees connector credentials, your password or your session.</li>
      </ul>

      <h2>Approving: link or just say so</h2>
      <p>
        Every request comes with a link to a review page on this site; open it, look at the snapshot, and approve there. If you prefer, you can also tick <strong>“let it carry out small changes and open access when I tell it to in the chat”</strong>
        when you connect, and then just say “yes, approve it”. That option is off unless you tick it, and it has limits: it only works on what that same connection proposed, after a short pause, for changes of up to 100 records and for specific tables
        (never a whole project), its approvals are logged with your words, and larger changes still need this site. Data can contain text written by other people, so keep it off if you do not need it. Your assistant app may also ask you to confirm each action.
      </p>

      <h2>Keeping control</h2>
      <ul>
        <li>See and disconnect every connected app under <Link href="/profile">Profile → Connected AI apps</Link>. Disconnecting takes effect immediately.</li>
        <li>Access tokens last one hour and are renewed automatically. If a renewal token is ever used twice, the connection is cut off.</li>
        <li>Changing your password or choosing “Sign out of all devices” disconnects every assistant.</li>
        <li>Every call is logged (which tool, which table, how many rows, and your words if you approved in chat; never data values) and kept for 30 days.</li>
        <li>The tokens given to assistants only work on this connector: they cannot open your account or call the rest of AnalyzeIt.</li>
        <li>Data you let it read is sent to that assistant’s provider, like anything you type into it. Allow only what you are comfortable sharing.</li>
      </ul>

      <h2>If something looks wrong</h2>
      <p>
        On the approval page, check the app name and the address it says it will send you back to. If you did not just start a connection from your assistant, choose Cancel. If you approved something by
        mistake, disconnect it from your profile.
      </p>
    </DocPage>
  );
}
