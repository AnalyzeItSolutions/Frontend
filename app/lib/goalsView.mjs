/** Plain-words helpers for the standing-questions and reconcile panels. */

const EVERY = { daily: 'every day', weekly: 'every week', monthly: 'every month' };

export function everyLabel(every) {
  return EVERY[every] || 'every week';
}

export function goalStatusLine(goal) {
  if (!goal) return '';
  if (!goal.enabled) return 'Paused.';
  const when = everyLabel(goal.every);
  switch (goal.last_status) {
    case 'ok': return `Runs ${when}. The last answer is saved.`;
    case 'needs_ai_access': return `Runs ${when}, but the assistant is not allowed to read this project yet.`;
    case 'no_data': return `Runs ${when}. The last run could not answer this question.`;
    case 'failed': return `Runs ${when}. The last run failed and will be tried again.`;
    default: return `Runs ${when}. Not run yet.`;
  }
}

export function changeLine(change) {
  const n = (change && change.new && change.new.length) || 0;
  const g = (change && change.gone && change.gone.length) || 0;
  const figs = Boolean(change && change.figures_changed);
  if (!n && !g && !figs) return 'Nothing changed since the run before.';
  const parts = [];
  if (figs) parts.push('the figures changed');
  if (n) parts.push(`${n} new`);
  if (g) parts.push(`${g} no longer showing`);
  return parts.join(', ') + '.';
}

export function reconcileSummary(result) {
  if (!result) return '';
  const { payments, refunds } = result.checked || { payments: 0, refunds: 0 };
  if (!payments) return 'No synced payments to check yet.';
  const looked = `Checked ${payments} payments and ${refunds} refunds.`;
  const skipped = (result.not_checked || []).length ? ` Not checked: ${result.not_checked.join(' and ')} (not synced yet).` : '';
  if (result.clean) return `${looked} Everything adds up.${skipped}`;
  const n = result.findings.length;
  return `${looked} ${n} thing${n === 1 ? '' : 's'} to look at.${skipped}`;
}

export function runGoalMessage(res, err) {
  if (err) return err.status === 429 ? 'This question already ran in the last hour.' : err.message || 'Could not run it.';
  switch (res && res.status) {
    case 'ok': return 'Ran it. The answer is below.';
    case 'needs_ai_access': return 'Allow the assistant to read this project first (AI data access, above).';
    case 'no_data': return 'This question could not be answered from the data. If your plan has no model runs left, only open questions like "What stands out in my data?" work.';
    default: return 'It did not finish. Try again.';
  }
}

export function runKindLabel(run) {
  return run && run.used_llm ? 'written by the assistant' : 'automatic checks';
}
