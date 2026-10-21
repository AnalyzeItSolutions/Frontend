'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ApiUnavailableError, SERVICE_UNAVAILABLE_MESSAGE, clearAuthSession, fetchMe, getStoredToken } from '../../lib/auth';

// A signed-in check that just succeeded is trusted for a few minutes, so moving between tabs does not
// re-verify the account (and flash "Checking account…") on every click. A 401 anywhere clears the token,
// which invalidates this.
const VERIFIED_FOR_MS = 5 * 60 * 1000;
let verified: { token: string; at: number } | null = null;

function recentlyVerified(): boolean {
  const token = getStoredToken();
  return Boolean(token && verified && verified.token === token && Date.now() - verified.at < VERIFIED_FOR_MS);
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(() => recentlyVerified());
  const [unavailable, setUnavailable] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function gate() {
      const next = `${pathname}${window.location.search}`;
      if (!getStoredToken()) {
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      if (recentlyVerified()) {
        setAllowed(true);
        return;
      }

      try {
        const me = await fetchMe();
        if (cancelled) return;
        if (!me) {
          clearAuthSession();
          setAllowed(false);
          router.replace(`/login?next=${encodeURIComponent(next)}`);
          return;
        }
        verified = { token: getStoredToken() || '', at: Date.now() };
        setUnavailable('');
        setAllowed(true);
      } catch (err) {
        if (cancelled) return;
        setAllowed(false);
        setUnavailable(
          err instanceof ApiUnavailableError
            ? err.message
            : SERVICE_UNAVAILABLE_MESSAGE,
        );
      }
    }

    void gate();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (unavailable) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--bg)] px-6 text-center text-[var(--text-primary)]">
        <p className="font-serif text-xl">Please try again shortly</p>
        <p className="max-w-md text-sm text-[var(--text-muted)]">{unavailable}</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--bg)] text-[var(--text-primary)]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
          Checking account…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
