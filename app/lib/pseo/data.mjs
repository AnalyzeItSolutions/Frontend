// Sample data behind the /metrics and /methods pages. It is made up, labelled as made up on every page, and small enough to
// print in full so a reader can check every worked figure by hand. Each table is also served as a CSV (/sample-data/<name>.csv)
// and the code on each page is run against these exact rows by scripts/seo/verify_snippets.py before it ships.
// Keep the monthly rows internally consistent: customers_end = customers_start + new_customers - customers_churned, and
// mrr_end = mrr_start + mrr_new + mrr_expansion - mrr_contraction - mrr_churned; next month starts where the last one ended.

export const DATA_UPDATED = '2026-10-22';

export const MONTHLY_COLUMNS = [
  { key: 'month', label: 'Month', unit: 'text' },
  { key: 'revenue', label: 'Revenue (net of discounts)', unit: 'inr' },
  { key: 'cogs', label: 'Cost of goods sold', unit: 'inr' },
  { key: 'discounts', label: 'Discounts given', unit: 'inr' },
  { key: 'refunds', label: 'Refunds paid', unit: 'inr' },
  { key: 'shipping_cost', label: 'Shipping cost', unit: 'inr' },
  { key: 'marketing_spend', label: 'Marketing spend', unit: 'inr' },
  { key: 'ad_revenue', label: 'Revenue attributed to ads', unit: 'inr' },
  { key: 'ad_impressions', label: 'Ad impressions', unit: 'count' },
  { key: 'ad_clicks', label: 'Ad clicks', unit: 'count' },
  { key: 'sessions', label: 'Website sessions', unit: 'count' },
  { key: 'add_to_carts', label: 'Sessions with an add-to-cart', unit: 'count' },
  { key: 'checkouts', label: 'Checkouts started', unit: 'count' },
  { key: 'orders', label: 'Orders', unit: 'count' },
  { key: 'units_sold', label: 'Units sold', unit: 'count' },
  { key: 'orders_cod', label: 'Cash-on-delivery orders', unit: 'count' },
  { key: 'orders_returned', label: 'Orders returned', unit: 'count' },
  { key: 'orders_rto', label: 'Orders returned to origin (undelivered)', unit: 'count' },
  { key: 'payment_attempts', label: 'Online payment attempts', unit: 'count' },
  { key: 'payments_captured', label: 'Online payments captured', unit: 'count' },
  { key: 'buying_customers', label: 'Customers who ordered', unit: 'count' },
  { key: 'repeat_customers', label: 'Of those, customers who had ordered before', unit: 'count' },
  { key: 'new_customers', label: 'New subscribers', unit: 'count' },
  { key: 'customers_start', label: 'Subscribers at start of month', unit: 'count' },
  { key: 'customers_churned', label: 'Subscribers who cancelled', unit: 'count' },
  { key: 'customers_end', label: 'Subscribers at end of month', unit: 'count' },
  { key: 'mrr_start', label: 'MRR at start of month', unit: 'inr' },
  { key: 'mrr_new', label: 'New MRR', unit: 'inr' },
  { key: 'mrr_expansion', label: 'Expansion MRR', unit: 'inr' },
  { key: 'mrr_contraction', label: 'Contraction MRR', unit: 'inr' },
  { key: 'mrr_churned', label: 'Churned MRR', unit: 'inr' },
  { key: 'mrr_end', label: 'MRR at end of month', unit: 'inr' },
  { key: 'inventory_value', label: 'Average inventory value (at cost)', unit: 'inr' },
  { key: 'email_sent', label: 'Emails delivered', unit: 'count' },
  { key: 'email_opened', label: 'Emails opened', unit: 'count' },
  { key: 'email_clicked', label: 'Emails clicked', unit: 'count' },
  { key: 'email_unsubscribed', label: 'Unsubscribes', unit: 'count' },
  { key: 'nps_promoters', label: 'NPS promoters (9–10)', unit: 'count' },
  { key: 'nps_passives', label: 'NPS passives (7–8)', unit: 'count' },
  { key: 'nps_detractors', label: 'NPS detractors (0–6)', unit: 'count' },
  { key: 'support_tickets', label: 'Support tickets', unit: 'count' },
  { key: 'tickets_resolved_first_contact', label: 'Tickets resolved on first contact', unit: 'count' },
];

const M = (month, v) => ({ month, ...v });

export const MONTHLY = [
  M('2026-01', { revenue: 412000, cogs: 226600, discounts: 31000, refunds: 18500, shipping_cost: 49100, marketing_spend: 96000, ad_revenue: 268000, ad_impressions: 820000, ad_clicks: 9840, sessions: 31200, add_to_carts: 2480, checkouts: 1310, orders: 702, units_sold: 1180, orders_cod: 281, orders_returned: 41, orders_rto: 38, payment_attempts: 512, payments_captured: 421, buying_customers: 640, repeat_customers: 210, new_customers: 120, customers_start: 800, customers_churned: 40, customers_end: 880, mrr_start: 180000, mrr_new: 22000, mrr_expansion: 6000, mrr_contraction: 3500, mrr_churned: 9000, mrr_end: 195500, inventory_value: 610000, email_sent: 24000, email_opened: 7920, email_clicked: 960, email_unsubscribed: 72, nps_promoters: 142, nps_passives: 61, nps_detractors: 37, support_tickets: 310, tickets_resolved_first_contact: 198 }),
  M('2026-02', { revenue: 438500, cogs: 236800, discounts: 35200, refunds: 21300, shipping_cost: 52400, marketing_spend: 102000, ad_revenue: 281000, ad_impressions: 865000, ad_clicks: 10380, sessions: 33800, add_to_carts: 2700, checkouts: 1420, orders: 748, units_sold: 1250, orders_cod: 292, orders_returned: 47, orders_rto: 42, payment_attempts: 547, payments_captured: 456, buying_customers: 681, repeat_customers: 228, new_customers: 135, customers_start: 880, customers_churned: 44, customers_end: 971, mrr_start: 195500, mrr_new: 24500, mrr_expansion: 7200, mrr_contraction: 4100, mrr_churned: 10200, mrr_end: 212900, inventory_value: 640000, email_sent: 25500, email_opened: 8160, email_clicked: 1020, email_unsubscribed: 80, nps_promoters: 150, nps_passives: 66, nps_detractors: 42, support_tickets: 335, tickets_resolved_first_contact: 221 }),
  M('2026-03', { revenue: 471200, cogs: 259200, discounts: 29800, refunds: 19800, shipping_cost: 56800, marketing_spend: 118000, ad_revenue: 305000, ad_impressions: 940000, ad_clicks: 11750, sessions: 36500, add_to_carts: 2950, checkouts: 1560, orders: 812, units_sold: 1370, orders_cod: 309, orders_returned: 45, orders_rto: 49, payment_attempts: 601, payments_captured: 503, buying_customers: 735, repeat_customers: 251, new_customers: 150, customers_start: 971, customers_churned: 52, customers_end: 1069, mrr_start: 212900, mrr_new: 26000, mrr_expansion: 6800, mrr_contraction: 3900, mrr_churned: 11800, mrr_end: 230000, inventory_value: 655000, email_sent: 27100, email_opened: 8940, email_clicked: 1140, email_unsubscribed: 79, nps_promoters: 161, nps_passives: 70, nps_detractors: 39, support_tickets: 352, tickets_resolved_first_contact: 239 }),
  M('2026-04', { revenue: 455800, cogs: 255200, discounts: 41500, refunds: 24100, shipping_cost: 54000, marketing_spend: 99000, ad_revenue: 287000, ad_impressions: 880000, ad_clicks: 10120, sessions: 34100, add_to_carts: 2690, checkouts: 1400, orders: 771, units_sold: 1290, orders_cod: 285, orders_returned: 58, orders_rto: 44, payment_attempts: 579, payments_captured: 486, buying_customers: 702, repeat_customers: 244, new_customers: 128, customers_start: 1069, customers_churned: 61, customers_end: 1136, mrr_start: 230000, mrr_new: 21500, mrr_expansion: 7400, mrr_contraction: 4600, mrr_churned: 12900, mrr_end: 241400, inventory_value: 690000, email_sent: 28400, email_opened: 8800, email_clicked: 1050, email_unsubscribed: 94, nps_promoters: 148, nps_passives: 72, nps_detractors: 48, support_tickets: 368, tickets_resolved_first_contact: 241 }),
  M('2026-05', { revenue: 502300, cogs: 271200, discounts: 38800, refunds: 22600, shipping_cost: 59200, marketing_spend: 124000, ad_revenue: 322000, ad_impressions: 990000, ad_clicks: 12380, sessions: 38900, add_to_carts: 3150, checkouts: 1650, orders: 846, units_sold: 1420, orders_cod: 304, orders_returned: 52, orders_rto: 47, payment_attempts: 648, payments_captured: 542, buying_customers: 768, repeat_customers: 270, new_customers: 160, customers_start: 1136, customers_churned: 57, customers_end: 1239, mrr_start: 241400, mrr_new: 27200, mrr_expansion: 8100, mrr_contraction: 4200, mrr_churned: 12100, mrr_end: 260400, inventory_value: 672000, email_sent: 29800, email_opened: 9540, email_clicked: 1220, email_unsubscribed: 88, nps_promoters: 170, nps_passives: 75, nps_detractors: 41, support_tickets: 381, tickets_resolved_first_contact: 260 }),
  M('2026-06', { revenue: 548900, cogs: 290900, discounts: 44100, refunds: 25400, shipping_cost: 64200, marketing_spend: 131000, ad_revenue: 349000, ad_impressions: 1050000, ad_clicks: 13340, sessions: 41600, add_to_carts: 3380, checkouts: 1790, orders: 917, units_sold: 1530, orders_cod: 321, orders_returned: 60, orders_rto: 53, payment_attempts: 707, payments_captured: 596, buying_customers: 830, repeat_customers: 296, new_customers: 175, customers_start: 1239, customers_churned: 66, customers_end: 1348, mrr_start: 260400, mrr_new: 29800, mrr_expansion: 8600, mrr_contraction: 4800, mrr_churned: 13400, mrr_end: 280600, inventory_value: 705000, email_sent: 31500, email_opened: 9770, email_clicked: 1260, email_unsubscribed: 101, nps_promoters: 181, nps_passives: 79, nps_detractors: 45, support_tickets: 402, tickets_resolved_first_contact: 285 }),
];

// Thirty days of one store's orders by channel, with ad spend, for the statistics pages. Day 17 has a deliberate spike
// (a one-day sale) so the outlier pages have something real to find.
export const DAILY_COLUMNS = [
  { key: 'day', label: 'Day', unit: 'count' },
  { key: 'ad_spend', label: 'Ad spend (₹)', unit: 'inr' },
  { key: 'website_orders', label: 'Website orders', unit: 'count' },
  { key: 'app_orders', label: 'App orders', unit: 'count' },
  { key: 'avg_basket', label: 'Average basket (₹)', unit: 'inr' },
];

const WEB = [24, 27, 22, 30, 28, 25, 31, 29, 26, 33, 30, 28, 35, 32, 29, 34, 61, 31, 36, 33, 30, 37, 35, 32, 38, 36, 34, 40, 37, 39];
const APP = [18, 21, 19, 22, 24, 20, 23, 25, 22, 26, 24, 23, 27, 25, 24, 28, 44, 26, 29, 27, 25, 30, 28, 27, 31, 29, 28, 32, 30, 33];
const SPEND = [3800, 3000, 3900, 3200, 4000, 4100, 3100, 3600, 4100, 3500, 4300, 4500, 3900, 3900, 4300, 3700, 7200, 4800, 3800, 4500, 4500, 4000, 4200, 4800, 4300, 5000, 3900, 5000, 5200, 4700];
const BASKET = [612, 598, 640, 587, 605, 622, 579, 601, 633, 590, 615, 608, 584, 597, 626, 593, 548, 611, 589, 603, 620, 586, 599, 614, 581, 595, 607, 576, 602, 590];

export const DAILY = WEB.map((w, i) => ({ day: i + 1, ad_spend: SPEND[i], website_orders: w, app_orders: APP[i], avg_basket: BASKET[i] }));

export const DATASETS = {
  monthly: { name: 'monthly', title: 'Six months of a made-up subscription D2C brand', columns: MONTHLY_COLUMNS, rows: MONTHLY },
  daily: { name: 'daily', title: 'Thirty days of orders from a made-up store', columns: DAILY_COLUMNS, rows: DAILY },
};

export function toCsv(name) {
  const d = DATASETS[name];
  const keys = d.columns.map((c) => c.key);
  return [keys.join(','), ...d.rows.map((r) => keys.map((k) => r[k]).join(','))].join('\n') + '\n';
}

/** Excel column letter for a column of a dataset, as laid out in its CSV (A = first column). */
export function colLetter(name, key) {
  const i = DATASETS[name].columns.findIndex((c) => c.key === key);
  if (i < 0) throw new Error(`no column ${key} in ${name}`);
  return letter(i + 1);
}

/** Spreadsheet column letter for a 1-based column number: 1 → A, 27 → AA. */
export function letter(n) {
  let s = '';
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
