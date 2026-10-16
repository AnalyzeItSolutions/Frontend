'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { BrandLogo } from '../Components/ui/Brand';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../Components/ui/ThemeToggle';
import { motion, AnimatePresence } from 'motion/react';
import {
  IconMail,
  IconLock,
  IconUser,
  IconEye,
  IconEyeOff,
  IconArrowRight,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { ApiUnavailableError, SERVICE_UNAVAILABLE_MESSAGE, clearAuthSession, confirmAuthSession, fetchMe, getStoredToken, getStoredUser, login, register, safeNextPath } from '../lib/auth';
import { destinationAfterAuth, loadProgress, seedNewAccount } from '../lib/onboarding.mjs';
import { GoogleSignInButton } from '../Components/auth/GoogleSignInButton';
import { GitHubSignInButton } from '../Components/auth/GitHubSignInButton';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'login' | 'register';

interface FieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon: React.ReactNode;
  error?: string;
  autoComplete?: string;
  rightElement?: React.ReactNode;
}

// ─── Field Component ──────────────────────────────────────────────────────────
const Field: React.FC<FieldProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
  error,
  autoComplete,
  rightElement,
}) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={id}
      className="text-xs font-mono tracking-wider uppercase text-[var(--text-secondary)]"
    >
      {label}
    </label>
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#414141]/40 dark:text-[#888888] pointer-events-none">
        {icon}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full pl-10 ${rightElement ? 'pr-10' : 'pr-4'} py-3 rounded-xl bg-white/60 dark:bg-[#262626] border text-sm text-[var(--text-primary)] placeholder-[#414141]/30 dark:placeholder-[#787878] focus:outline-none focus:ring-2 transition-all duration-200 ${
          error
            ? 'border-red-400/60 dark:border-[#D97870]/60 focus:ring-red-300/40 dark:focus:ring-[#D97870]/30'
            : 'border-[var(--border)] focus:ring-[#F2F2F2]/30 focus:border-[#F2F2F2]/40'
        }`}
      />
      {rightElement && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#414141]/40 dark:text-[#888888]">
          {rightElement}
        </span>
      )}
    </div>
    {error && (
      <p className="text-xs text-red-500 dark:text-[#D97870] font-mono mt-0.5">{error}</p>
    )}
  </div>
);

// ─── Password Strength Meter ───────────────────────────────────────────────────
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels: Array<{ label: string; color: string }> = [
    { label: 'Too short', color: '#D97870' },
    { label: 'Weak', color: '#D97870' },
    { label: 'Fair', color: '#D9AD70' },
    { label: 'Good', color: '#9EBB9A' },
    { label: 'Strong', color: '#9EBB9A' },
  ];
  return { score, ...levels[score] };
}

const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= score ? color : 'rgba(150, 150, 150, 0.2)' }}
          />
        ))}
      </div>
      <span className="text-xs font-mono" style={{ color }}>
        {label}
      </span>
    </div>
  );
};

// ─── OAuth (Google + GitHub) ──────────────────────────────────────────────────
const SocialAuthSection: React.FC<{
  onSuccess: (meta?: { is_new?: boolean }) => void;
  context: 'signin' | 'signup';
}> = ({ onSuccess, context }) => (
  <div className="flex flex-col gap-2.5 w-full">
    <GoogleSignInButton onSuccess={onSuccess} context={context} enableOneTap={context === 'signin'} />
    <GitHubSignInButton context={context} />
  </div>
);

// ─── Login Form ───────────────────────────────────────────────────────────────
const LoginForm: React.FC<{ onSuccess: (meta?: { is_new?: boolean }) => void }> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      await confirmAuthSession();
      onSuccess();
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {generalError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 dark:bg-[#382522] border border-red-500/20 dark:border-[#D97870]/30 text-xs text-red-600 dark:text-[#D97870] font-mono">
          <IconAlertCircle size={16} className="flex-shrink-0" />
          <span>{generalError}</span>
        </div>
      )}
      <Field
        id="login-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        icon={<IconMail size={16} />}
        error={errors.email}
        autoComplete="email"
      />

      <div className="flex flex-col gap-1.5">
        <Field
          id="login-password"
          label="Password"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          icon={<IconLock size={16} />}
          error={errors.password}
          autoComplete="current-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="cursor-pointer hover:text-[#414141] dark:hover:text-[#EDEDED] transition-colors"
            >
              {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
          }
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-[#F2F2F2] hover:text-[#F2F2F2] font-mono transition-colors cursor-pointer"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[var(--brand-ink)] text-sm font-medium tracking-wide transition-all duration-200 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-1"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Signing in…
          </span>
        ) : (
          <>
            Sign in
            <IconArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      <SocialAuthSection onSuccess={onSuccess} context="signin" />
    </form>
  );
};

// ─── Register Form ────────────────────────────────────────────────────────────
const RegisterForm: React.FC<{ onSuccess: (meta?: { is_new?: boolean }) => void }> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
    agreed?: string;
  }>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Minimum 8 characters';
    if (!confirm) e.confirm = 'Please confirm your password';
    else if (confirm !== password) e.confirm = 'Passwords do not match';
    if (!agreed) e.agreed = 'You must accept the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      await confirmAuthSession();
      onSuccess({ is_new: true });
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {generalError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 dark:bg-[#382522] border border-red-500/20 dark:border-[#D97870]/30 text-xs text-red-600 dark:text-[#D97870] font-mono">
          <IconAlertCircle size={16} className="flex-shrink-0" />
          <span>{generalError}</span>
        </div>
      )}
      <Field
        id="reg-name"
        label="Full Name"
        type="text"
        value={name}
        onChange={setName}
        placeholder="Jane Smith"
        icon={<IconUser size={16} />}
        error={errors.name}
        autoComplete="name"
      />
      <Field
        id="reg-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        icon={<IconMail size={16} />}
        error={errors.email}
        autoComplete="email"
      />
      <div className="flex flex-col gap-1.5">
        <Field
          id="reg-password"
          label="Password"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          placeholder="Min. 8 characters"
          icon={<IconLock size={16} />}
          error={errors.password}
          autoComplete="new-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="cursor-pointer hover:text-[#414141] dark:hover:text-[#EDEDED] transition-colors"
            >
              {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
          }
        />
        <PasswordStrength password={password} />
      </div>
      <Field
        id="reg-confirm"
        label="Confirm Password"
        type={showConfirm ? 'text' : 'password'}
        value={confirm}
        onChange={setConfirm}
        placeholder="Repeat password"
        icon={<IconLock size={16} />}
        error={errors.confirm}
        autoComplete="new-password"
        rightElement={
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="cursor-pointer hover:text-[#414141] dark:hover:text-[#EDEDED] transition-colors"
          >
            {showConfirm ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          </button>
        }
      />

      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <button
            type="button"
            role="checkbox"
            aria-checked={agreed}
            onClick={() => setAgreed((v) => !v)}
            className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-all duration-200 cursor-pointer ${
              agreed
                ? 'bg-[var(--brand)] border-[#F2F2F2]'
                : 'bg-white/60 dark:bg-[#262626] border-[#414141]/20 dark:border-[#262626] group-hover:border-[#F2F2F2]/40'
            }`}
          >
            {agreed && <IconCheck size={10} stroke={3} className="text-white" />}
          </button>
          <span className="text-xs text-[var(--text-secondary)] leading-relaxed">
            I agree to the{' '}
            <Link href="/terms" target="_blank" className="text-[#F2F2F2] hover:text-[#F2F2F2] hover:underline">Terms of Service</Link>
            {', '}
            <Link href="/privacy" target="_blank" className="text-[#F2F2F2] hover:text-[#F2F2F2] hover:underline">Privacy Policy</Link>
            {', and '}
            <Link href="/acceptable-use" target="_blank" className="text-[#F2F2F2] hover:text-[#F2F2F2] hover:underline">Acceptable Use Policy</Link>
          </span>
        </label>
        {errors.agreed && (
          <p className="text-xs text-red-500 dark:text-[#D97870] font-mono ml-6">{errors.agreed}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[var(--brand-ink)] text-sm font-medium tracking-wide transition-all duration-200 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-1"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating account…
          </span>
        ) : (
          <>
            {generalError ? 'Try again' : 'Create account'}
            <IconArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </>
        )}
      </button>
      {generalError && !loading ? (
        <p className="text-center text-[11px] text-[#414141]/55 dark:text-[#888888]">
          Button unlocked — fix the issue above, then try again. If the account was created, use Sign in.
        </p>
      ) : null}

      <SocialAuthSection onSuccess={onSuccess} context="signup" />
    </form>
  );
};

// ─── Success State ────────────────────────────────────────────────────────────
const SuccessState: React.FC<{ isNew: boolean }> = ({ isNew }) => {
  const router = useRouter();
  const [continueHref, setContinueHref] = useState('/research');

  useEffect(() => {
    const requested = safeNextPath(new URLSearchParams(window.location.search).get('next'));
    const user = getStoredUser();
    if (isNew && user?.id) seedNewAccount(localStorage, sessionStorage, user.id);
    const existing = user?.id ? loadProgress(localStorage, user.id) : null;
    const dest = destinationAfterAuth(requested, isNew, existing?.status);
    setContinueHref(dest);
    if (!getStoredToken()) {
      return;
    }
    const timer = setTimeout(() => {
      router.replace(dest);
    }, 600);
    return () => clearTimeout(timer);
  }, [isNew, router]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-5 py-12 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-[#8FA98F]/20 dark:bg-[#283329] flex items-center justify-center">
        <IconCheck size={32} className="text-[#4A7C59] dark:text-[#9EBB9A]" />
      </div>
      <div>
        <h3 className="font-serif text-xl text-[var(--text-primary)] mb-1">
          {isNew ? 'Account created!' : 'Welcome back!'}
        </h3>
        <p className="text-sm text-[#414141]/55 dark:text-[#BABABA]">
          {isNew
            ? 'Your account is ready. A short setup is next…'
            : "You're signed in. Redirecting to your dashboard…"}
        </p>
      </div>
      <Link
        href={continueHref}
        className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#F2F2F2] hover:text-[#F2F2F2] transition-colors mt-2"
      >
        Continue to workspace <IconArrowRight size={13} />
      </Link>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
function LoginInner() {
  const [tab, setTab] = useState<Tab>('login');
  const [success, setSuccess] = useState(false);
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'register') setTab('register');

    async function restore() {
      if (!getStoredToken()) {
        if (!cancelled) setChecking(false);
        return;
      }
      try {
        const me = await fetchMe();
        if (cancelled) return;
        if (me) {
          setSuccess(true);
        } else {
          clearAuthSession();
        }
      } catch (err) {
        if (cancelled) return;
        setSessionError(
          err instanceof ApiUnavailableError
            ? err.message
            : SERVICE_UNAVAILABLE_MESSAGE,
        );
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSuccess = (meta?: { is_new?: boolean }) => {
    setIsNewAccount(typeof meta?.is_new === 'boolean' ? meta.is_new : tab === 'register');
    setSuccess(true);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[var(--bg)]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#F2F2F2]/25 border-t-[#F2F2F2]" />
        <p className="font-mono text-[11px] uppercase tracking-wider text-[#414141]/50 dark:text-[#888888]">
          Checking account…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col transition-colors duration-300">
      {/* Minimal top nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5">
        <Link href="/" className="flex items-center gap-2 group">
          <BrandLogo size={28} />
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/"
            className="text-xs font-mono uppercase tracking-wider text-[#414141]/50 dark:text-[#888888] hover:text-[#414141] dark:hover:text-[#EDEDED] transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </nav>

      {/* Centered card */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {sessionError ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-700 dark:border-[#D97870]/30 dark:bg-[#382522] dark:text-[#D97870]">
              {sessionError}
            </div>
          ) : null}
          {/* Heading */}
          <div className="mb-8 text-center">
            <AnimatePresence mode="wait">
              <motion.h1
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
                className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)] mb-2"
              >
                {tab === 'login' ? (
                  <>Welcome <span className="italic text-[#F2F2F2]">back</span></>
                ) : (
                  <>Join <span className="italic text-[#F2F2F2]">AnalyzeIt</span></>
                )}
              </motion.h1>
            </AnimatePresence>
            <p className="text-sm text-[#414141]/50 dark:text-[#888888]">
              {tab === 'login'
                ? 'Sign in to your workspace'
                : 'Create a free account to get started'}
            </p>
          </div>

          {/* Glass card */}
          <div className="glass-card dark:bg-[#191919] dark:border dark:border-[#262626] rounded-2xl p-6 sm:p-8 shadow-xl">
            {!success ? (
              <>
                {/* Tab switcher */}
                <div className="flex gap-1 p-1 bg-black/5 dark:bg-[#262626] border border-transparent dark:border-[#262626] rounded-xl mb-6">
                  {(['login', 'register'] as Tab[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setTab(t); setSuccess(false); }}
                      className={`flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        tab === t
                          ? 'bg-white dark:bg-[#2C2C2C] shadow-xs text-[var(--text-primary)] font-semibold border border-[#414141]/10 dark:border-[#484848]'
                          : 'text-[#414141]/45 dark:text-[#888888] hover:text-[#414141] dark:hover:text-[#EDEDED]'
                      }`}
                    >
                      {t === 'login' ? 'Sign In' : 'Register'}
                    </button>
                  ))}
                </div>

                {/* Animated form panels */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, x: tab === 'login' ? -14 : 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: tab === 'login' ? 14 : -14 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                  >
                    {tab === 'login' ? (
                      <LoginForm onSuccess={handleSuccess} />
                    ) : (
                      <RegisterForm onSuccess={handleSuccess} />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Bottom toggle */}
                <p className="text-center text-xs text-[#414141]/45 dark:text-[#888888] mt-6">
                  {tab === 'login' ? (
                    <>
                      Don&apos;t have an account?{' '}
                      <button type="button" onClick={() => setTab('register')} className="text-[#F2F2F2] hover:text-[#F2F2F2] font-medium transition-colors cursor-pointer">
                        Create one
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button type="button" onClick={() => setTab('login')} className="text-[#F2F2F2] hover:text-[#F2F2F2] font-medium transition-colors cursor-pointer">
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </>
            ) : (
              <SuccessState isNew={isNewAccount} />
            )}
          </div>

          <p className="text-center text-xs text-[#414141]/40 dark:text-[#888888]/70 mt-6 font-mono space-x-3">
            <Link href="/privacy" className="hover:text-[#F2F2F2] transition-colors">Privacy</Link>
            <Link href="/refund" className="hover:text-[#F2F2F2] transition-colors">Refund</Link>
            <Link href="/shipping" className="hover:text-[#F2F2F2] transition-colors">Shipping</Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms" className="hover:text-[#F2F2F2] transition-colors">Terms</Link>
            <span aria-hidden="true">·</span>
            <Link href="/security" className="hover:text-[#F2F2F2] transition-colors">Security</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#F2F2F2]/25 border-t-[#F2F2F2]" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
