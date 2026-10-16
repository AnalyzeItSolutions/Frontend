'use client';

import React, { useState } from 'react';
import { IconBrandGithub } from '@tabler/icons-react';
import { safeNextPath, startGitHubAuth } from '../../lib/auth';

type Props = {
  onError?: (message: string) => void;
  context?: 'signin' | 'signup';
};

export function GitHubSignInButton({ onError, context = 'signin' }: Props) {
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleClick = async () => {
    setBusy(true);
    setLocalError('');
    try {
      const next = safeNextPath(new URLSearchParams(window.location.search).get('next'));
      await startGitHubAuth(next);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'GitHub sign-in failed';
      setLocalError(msg);
      onError?.(msg);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="group flex items-center justify-center gap-2.5 w-full py-2.5 rounded-full border border-[#414141]/15 dark:border-[#484848] bg-white dark:bg-[#262626] text-sm font-medium text-[#414141] dark:text-[#EDEDED] hover:bg-[#F2F2F2] dark:hover:bg-[#2C2C2C] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {busy ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-[#414141]/20 border-t-[#414141] dark:border-[#EDEDED]/20 dark:border-t-[#EDEDED] rounded-full animate-spin" />
            Redirecting to GitHub…
          </span>
        ) : (
          <>
            <IconBrandGithub size={18} stroke={1.75} />
            {context === 'signup' ? 'Sign up with GitHub' : 'Sign in with GitHub'}
          </>
        )}
      </button>
      {localError ? (
        <p className="text-center text-xs text-red-500 dark:text-[#D97870]">{localError}</p>
      ) : null}
    </div>
  );
}
