import { getAuthHeaders } from './auth';
import { apiErrorFrom } from './customObjectsApi';

const API_V1 = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/v1`;

export interface PaygInvoice {
  id: string;
  months: string[];
  amount_usd: number;
  amount: number | null;
  currency: string | null;
  status: 'issued' | 'overdue' | 'paid' | string;
  pay_url: string | null;
  created_at: string | null;
  due_at: string | null;
}

export interface PaygState {
  enabled: boolean;
  suspended: boolean;
  cap_usd: number;
  max_cap_usd: number;
  usd_per_million_tokens: number;
  month: string;
  spent_this_month_usd: number;
  runs_this_month: number;
  remaining_usd: number;
  unbilled_previous_usd: number;
  invoices: PaygInvoice[];
  invoice_minimum_usd: number;
  grace_days: number;
}

export async function getPayg(): Promise<PaygState> {
  const res = await fetch(`${API_V1}/billing/payg`, { headers: { ...getAuthHeaders() } });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not load pay as you go');
  return res.json();
}

export async function savePayg(body: { enabled?: boolean; cap_usd?: number }): Promise<PaygState> {
  const res = await fetch(`${API_V1}/billing/payg`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(body) });
  if (!res.ok) throw await apiErrorFrom(res, 'Could not save');
  return res.json();
}
