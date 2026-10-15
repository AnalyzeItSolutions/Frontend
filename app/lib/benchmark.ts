/**
 * The token-savings headline. Until the benchmark is published, `published` stays false and every surface that
 * shows the number marks it as a placeholder. To go live: set published to true, fill `reduction`, `method` and
 * `reportUrl` from the benchmark write-up, and nothing else on the landing page needs to change.
 */
export const TOKEN_BENCHMARK: {
  published: boolean;
  /** Share of tokens saved against re-sending the whole history, e.g. "62%". */
  reduction: string;
  /** One line on what was measured, shown under the number once published. */
  method: string;
  reportUrl: string | null;
} = {
  published: false,
  reduction: 'XX%',
  method: 'Benchmark pending',
  reportUrl: null,
};
