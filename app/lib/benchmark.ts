/**
 * The token-savings headline, taken from `Model/docs/token-memory-report.md` (measured 2026-10-15, real agent loop, provider usage
 * figures). Every surface that shows a number reads it from here; change the report and this file together, never one alone.
 * The figure is for long conversations only. On ordinary single questions the measured difference is small and mostly noise, so no
 * surface may quote it as a general saving.
 */
export const TOKEN_BENCHMARK: {
  published: boolean;
  /** Share of prompt tokens saved on a long conversation, against replaying the last eight messages whole. */
  reduction: string;
  /** One line on what was measured, shown under the number. */
  method: string;
  reportUrl: string | null;
  /** The history layer is switched on account by account; the number is a measurement, not what every account sees today. */
  rollingOut: boolean;
  measured: string;
  figures: {
    oldTurnBefore: string;
    oldTurnAfter: string;
    promptBefore: string;
    promptAfter: string;
    costReduction: string;
    reachTurns: string;
  };
} = {
  published: true,
  reduction: '71%',
  method: 'Measured on a 60-turn conversation, 24 questions: questions about an earlier turn answered correctly 18 of 18, up from 0 of 18.',
  reportUrl: '/docs/tokens',
  rollingOut: true,
  measured: '15 October 2026',
  figures: {
    oldTurnBefore: '0 of 18',
    oldTurnAfter: '18 of 18',
    promptBefore: '118,657',
    promptAfter: '34,697',
    costReduction: '92%',
    reachTurns: '1,000',
  },
};
