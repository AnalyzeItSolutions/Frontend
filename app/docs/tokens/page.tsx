import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '../../Components/docs/DocPage';
import { TOKEN_BENCHMARK } from '../../lib/benchmark';

export const metadata: Metadata = {
  title: 'Fewer tokens, longer memory: how it was measured — AnalyzeIt docs',
  description:
    'How AnalyzeIt keeps long conversations on a small prompt: what was measured, the numbers before and after, what the saving does not cover, and how it is switched on.',
  alternates: { canonical: '/docs/tokens' },
};

export default function Page() {
  const b = TOKEN_BENCHMARK;
  return (
    <DocPage
      title="Fewer tokens, longer memory"
      subtitle="What the saving is, how it was measured, and where it does not apply."
    >
      <h2>The result</h2>
      <p>
        On a 60-turn conversation, questions about something said earlier were answered correctly <strong>{b.figures.oldTurnAfter}</strong>{' '}
        times (before: {b.figures.oldTurnBefore}). The prompt shrank <strong>{b.reduction}</strong> ({b.figures.promptBefore} to{' '}
        {b.figures.promptAfter} tokens across 24 questions) and model cost fell {b.figures.costReduction}. Measured {b.measured}.
      </p>
      <p>
        That is a figure for questions that depend on a long history. On an ordinary single question about attached data the saving is
        small and mostly within run-to-run noise, so we do not claim a general “N times fewer tokens”.
      </p>

      <h2>What changed</h2>
      <ul>
        <li>
          <strong>Recall instead of replay.</strong> Before, every question carried the last 8 messages whole. Now it carries the last two
          turns and the earlier turns that match the question, as short excerpts picked sentence by sentence. Matching uses the words and
          numbers of the question; it adds no model call and no new storage.
        </li>
        <li>
          <strong>A direct route for “what did I say earlier”.</strong> A question that clearly asks about the past, with nothing new to
          compute, is answered on the small model instead of the full agent loop.
        </li>
        <li>
          <strong>Long tool results stay out of the prompt.</strong> A result over 2,400 characters goes in as its head plus a marker, and
          the rest is fetched only if the answer needs it. This is what makes web questions consistently smaller.
        </li>
        <li>
          <strong>Your permissions still apply.</strong> Anything hidden by your AI-data-access settings is removed before recall runs, so
          it cannot come back.
        </li>
      </ul>

      <h2>How far back it reaches</h2>
      <p>
        Without any model calls, the six planted facts were reachable inside the prompt 6 of 6 times at 60, 120, 250, 500 and{' '}
        {b.figures.reachTurns} turns, at about 2,800 characters of history per question every time. The old shape reached none of them.
        Finding the turn took about 14 ms at 250 turns and 57 ms at {b.figures.reachTurns}.
      </p>

      <h2>How it was measured</h2>
      <ul>
        <li>The real agent loop against the real model deployments. Tokens and cost come from the provider’s usage figures, summed over every model call.</li>
        <li>
          A generated 60-turn sales conversation with six planted facts (a return rate, a promo code, a revenue figure, a churn rate, a
          forecast, an agreed exclusion rule) and many nearby turns with other regions, months and numbers that a careless lookup would
          confuse with them. Six questions need an old turn and two need only the latest. Each was asked three times, 24 runs per setting.
          The answers are planted by the generator, never read from a model.
        </li>
        <li>Prices are third-party-reported list prices and will be checked against the provider’s price sheet.</li>
      </ul>

      <h2>What this does not claim</h2>
      <ul>
        <li>It is one generated conversation and 24 runs per setting: a large effect, a small sample.</li>
        <li>
          Matching is by words. A question that paraphrases heavily (“that thing with the March spike”) will recall less; a search by meaning
          over the same turns is the next step.
        </li>
        <li>Memory across separate chats (the stored library) was not part of this measurement.</li>
        <li>
          On 28 ordinary single questions the prompt was about 17% lower on average, but most of that is the agent choosing a different route
          on different runs. Pass rates were equal within noise.
        </li>
        <li>The provider’s own prefix cache already served 25 to 30% of prompt tokens before this change; we did not raise it and do not count it as a saving.</li>
      </ul>

      <h2>Availability</h2>
      <p>
        This is being switched on account by account, so you may not see it yet. It can be turned off at any time and nothing is stored or
        migrated, so turning it off returns the previous behaviour on the next question. Separately, how much your plan can keep in memory is
        on the <Link href="/docs/memory">Memory</Link> page and in <Link href="/docs/plans">plans</Link>.
      </p>
    </DocPage>
  );
}
