import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Check, Copy, Loader2, X, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

import { cn, copyToClipboard } from '@/lib/utils';
import { useUI } from '@/store/AppStores';
import type { Toast } from '@/types';

// ---------------- Button ----------------
type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'destructive' | 'ai';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--vp-primary)] text-white hover:bg-[var(--vp-primary-deep)] shadow-sm shadow-indigo-500/20',
  ai: 'text-white bg-gradient-to-r from-[var(--vp-primary-700)] via-[var(--vp-primary)] to-[var(--vp-primary-light)] hover:brightness-110 shadow-lg shadow-indigo-500/30',
  outline:
    'border border-[var(--vp-border-strong)] text-[var(--vp-text-primary)] hover:bg-[var(--vp-surface-alt)]',
  ghost: 'text-[var(--vp-text-secondary)] hover:bg-[var(--vp-surface-alt)] hover:text-[var(--vp-text-primary)]',
  destructive: 'bg-[var(--vp-danger)] text-white hover:opacity-90',
};
const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  type = 'button',
  onClick,
  disabled,
  className,
  children,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ---------------- Form field primitives ----------------
export const inputClass =
  'w-full rounded-md border border-[var(--vp-border-strong)] bg-[var(--vp-surface)] px-3.5 py-2.5 text-sm text-[var(--vp-text-primary)] placeholder:text-[var(--vp-text-muted)] outline-none transition focus:border-[var(--vp-border-active)] focus:ring-2 focus:ring-[var(--vp-ring)] disabled:opacity-60';

export function Field({
  label,
  error,
  hint,
  htmlFor,
  children,
}: {
  label?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  htmlFor?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-[var(--vp-text-secondary)]">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-[var(--vp-danger)]">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-[var(--vp-text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

// ---------------- Badge ----------------
type BadgeTone = 'gold' | 'green' | 'cyan' | 'rose' | 'muted' | 'indigo';
const badgeClass: Record<BadgeTone, string> = {
  gold: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  green: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  cyan: 'bg-sky-500/12 text-sky-600 dark:text-sky-400 ring-sky-500/20',
  rose: 'bg-rose-500/12 text-rose-600 dark:text-rose-400 ring-rose-500/20',
  indigo: 'bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20',
  muted: 'bg-[var(--vp-surface-alt)] text-[var(--vp-text-muted)] ring-[var(--vp-border)]',
};
export function Badge({ tone = 'muted', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        badgeClass[tone],
      )}
    >
      {children}
    </span>
  );
}

// ---------------- Toggle (switch) ----------------
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
      style={{ overflow: 'hidden', contain: 'layout', background: checked ? 'var(--vp-primary)' : 'var(--vp-border-strong)' }}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  );
}

// ---------------- Modal ----------------
export function Modal({
  open,
  title,
  onClose,
  children,
  size = 'md',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const panel = useRef<HTMLDivElement>(null);
  const widthClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useGSAP(
    () => {
      if (!open) return;
      if (panel.current) {
        gsap.fromTo(panel.current, { scale: 0.96, opacity: 0, y: 8 }, { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.6)' });
      }
    },
    { dependencies: [open] },
  );

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-elevated)] p-6 shadow-2xl',
          widthClass,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-[var(--vp-text-muted)] hover:bg-[var(--vp-surface-alt)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ---------------- Skeleton ----------------
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-md bg-[var(--vp-surface-alt)]', className)} />;
}

// ---------------- EmptyState ----------------
export function EmptyState({
  title,
  hint,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--vp-border-strong)] px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--vp-surface-alt)] text-[var(--vp-primary)]">
        {icon}
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-[var(--vp-text-muted)]">{hint}</p>
      {actionLabel && onAction && (
        <Button size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// ---------------- CopyButton ----------------
export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handle() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }
  return (
    <button
      type="button"
      onClick={handle}
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--vp-border-strong)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--vp-text-secondary)] hover:bg-[var(--vp-surface-alt)]"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

// ---------------- Toasts ----------------
const toastIcon: Record<Toast['type'], ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <XCircle className="h-5 w-5 text-rose-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-sky-500" />,
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (ref.current) gsap.fromTo(ref.current, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
    },
    { dependencies: [] },
  );
  return (
    <div
      ref={ref}
      className="pointer-events-auto flex w-80 items-start gap-3 rounded-xl border border-[var(--vp-border)] bg-[var(--vp-elevated)] p-3.5 shadow-xl"
    >
      <span className="mt-0.5">{toastIcon[toast.type]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-[12px] text-[var(--vp-text-muted)]">{toast.description}</p>}
      </div>
      <button onClick={onClose} className="text-[var(--vp-text-muted)] hover:text-[var(--vp-text-primary)]">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const { toasts, dismissToast } = useUI();
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed right-4 top-4 z-[200] flex flex-col items-end gap-2.5">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => dismissToast(t.id)} />
      ))}
    </div>,
    document.body,
  );
}
