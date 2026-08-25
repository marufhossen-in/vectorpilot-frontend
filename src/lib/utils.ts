import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Eliminate floating-point drift at 4 decimals. */
export function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

/** Format USD. Default 2 decimals; pass maxDigits for cost figures (4). */
export function usd(n: number, maxDigits = 2): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: maxDigits === 0 ? 0 : 2,
    maximumFractionDigits: maxDigits,
  });
}

/** Format a percentage. */
export function pct(n: number, digits = 0): string {
  return `${n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

/** Compact token counts (1.2M) above 10k, grouped below. */
export function formatTokens(n: number): string {
  if (n >= 10000) {
    return n.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 });
  }
  return n.toLocaleString('en-US');
}

/** Mask an API key for persistent display. */
export function maskKey(prefix: string, last4: string): string {
  return `${prefix}-••••${last4}`;
}

/** Derive the prefix before the first secret segment. */
export function keyPrefix(full: string): string {
  const parts = full.split('-');
  return parts.slice(0, 2).join('-');
}

/** Copy text to clipboard with a legacy fallback. Returns success boolean. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

/** Short unique id. */
export function genId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

/** Mock secret key generator. */
export function mockFullKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let body = '';
  for (let i = 0; i < 32; i += 1) body += chars[Math.floor(Math.random() * chars.length)];
  return `sk-aico-${body}`;
}

/** "x seconds ago" helper. */
export function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
