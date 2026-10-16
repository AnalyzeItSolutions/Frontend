/** Plain-words helpers for the pay as you go panel. */

export function usd(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '$0.00';
  return v > 0 && v < 0.01 ? '<$0.01' : `$${v.toFixed(2)}`;
}

export function paygStatusLine(s) {
  if (!s) return '';
  if (s.suspended) return 'Paused: an invoice is overdue. Pay it to switch pay as you go back on. You are on the Free limits meanwhile.';
  if (!s.enabled) return 'Off. You are on the Free limits. Switch it on to use the Standard model beyond them and pay after the month.';
  if (s.remaining_usd <= 0) return `You have reached this month’s ${usd(s.cap_usd)} cap. Model answers resume next month, or raise the cap.`;
  return `On. ${usd(s.spent_this_month_usd)} used of your ${usd(s.cap_usd)} cap this month. You are billed after the month ends.`;
}

export function rateLine(s) {
  if (!s) return '';
  const perDollar = Math.round(1_000_000 / 2500 / s.usd_per_million_tokens);
  return `${usd(s.usd_per_million_tokens)} per million tokens (output counts four times), which is about ${perDollar} typical answers per dollar.`;
}

export function invoiceLine(inv) {
  const months = (inv.months || []).join(', ');
  const amount = inv.currency && inv.amount != null ? `${inv.currency} ${Number(inv.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : usd(inv.amount_usd);
  const state = inv.status === 'paid' ? 'paid' : inv.status === 'overdue' ? 'overdue' : 'waiting for payment';
  return `${months}: ${amount}, ${state}`;
}

export function capProblem(value, s) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Enter a number.';
  if (n < 1) return 'The cap must be at least $1.';
  if (s && n > s.max_cap_usd) return `The cap can be up to ${usd(s.max_cap_usd)} for now. It rises as you pay invoices.`;
  return '';
}

export function planLimitLines(limits, label) {
  if (!limits) return [];
  return [
    `${label} plan, Claude plugin: ${limits.calls_per_day.toLocaleString()} calls a day (${limits.calls_per_minute} a minute)`,
    `${limits.rows_per_call} rows per read · ${limits.rows_per_day.toLocaleString()} rows a day`,
    `${limits.writes_per_day.toLocaleString()} proposed or approved changes a day`,
  ];
}
