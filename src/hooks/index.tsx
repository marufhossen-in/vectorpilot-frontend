import { useEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import { copyToClipboard } from '@/lib/utils';
import { nextMockUsageEvent } from '@/data/mock';
import { useUsage } from '@/store/AppStores';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Recalculate ScrollTrigger positions once after the page (and its images) settle,
// so triggers created before layout never strand content off-screen.
let refreshScheduled = false;
function scheduleRefresh(): void {
  if (refreshScheduled) return;
  refreshScheduled = true;
  const run = () => {
    ScrollTrigger.refresh();
    refreshScheduled = false;
  };
  if (document.readyState === 'complete') window.setTimeout(run, 140);
  else window.addEventListener('load', run, { once: true });
}

// ------------------------------------------------------------
// Reveal — scroll-triggered entrance (final state if reduced motion)
// ------------------------------------------------------------
interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  y?: number;
  blur?: boolean;
  as?: 'div' | 'section' | 'li' | 'article' | 'header';
  scroll?: boolean;
}
export function Reveal({
  children,
  className,
  delay = 0,
  stagger = 0,
  y = 26,
  blur = true,
  as = 'div',
  scroll = true,
}: RevealProps) {
  const scope = useRef<HTMLDivElement>(null);
  const Tag = as as 'div';
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const nodes = stagger ? Array.from(root.querySelectorAll('[data-reveal-item]')) : [root];
      if (nodes.length === 0) return;
      if (prefersReducedMotion()) {
        gsap.set(nodes, { opacity: 1, y: 0, filter: 'none' });
        return;
      }
      // Hide first, then reveal on scroll — guarantees content is never permanently blank.
      gsap.set(nodes, { y, opacity: 0, filter: blur ? 'blur(8px)' : 'none' });
      gsap.to(nodes, {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.9,
        delay,
        stagger,
        ease: 'power3.out',
        ...(scroll ? { scrollTrigger: { trigger: root, start: 'top 88%', once: true } } : {}),
      });
      scheduleRefresh();
    },
    { scope, dependencies: [delay, stagger, y, blur, scroll] },
  );
  return (
    <Tag ref={scope} className={className}>
      {children}
    </Tag>
  );
}

// ------------------------------------------------------------
// useTypewriter — type / hold / erase loop
// ------------------------------------------------------------
export function useTypewriter(phrases: string[], speedMs = 45): string {
  const [text, setText] = useState('');
  useEffect(() => {
    if (prefersReducedMotion()) {
      setText(phrases[0] ?? '');
      return;
    }
    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timer: number;
    const tick = () => {
      const phrase = phrases[phraseIdx % phrases.length] ?? '';
      if (!deleting) {
        charIdx += 1;
        setText(phrase.slice(0, charIdx));
        if (charIdx >= phrase.length) {
          deleting = true;
          timer = window.setTimeout(tick, 1400);
          return;
        }
        timer = window.setTimeout(tick, speedMs);
      } else {
        charIdx -= 1;
        setText(phrase.slice(0, charIdx));
        if (charIdx <= 0) {
          deleting = false;
          phraseIdx += 1;
          timer = window.setTimeout(tick, 280);
          return;
        }
        timer = window.setTimeout(tick, speedMs / 2);
      }
    };
    timer = window.setTimeout(tick, 400);
    return () => window.clearTimeout(timer);
  }, [phrases, speedMs]);
  return text;
}

// ------------------------------------------------------------
// AnimatedNumber — tween a numeric value with a formatter
// ------------------------------------------------------------
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const proxy = useRef({ v: value });
  useEffect(() => {
    if (prefersReducedMotion()) {
      if (ref.current) ref.current.textContent = format(value);
      proxy.current.v = value;
      return;
    }
    const tween = gsap.to(proxy.current, {
      v: value,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) ref.current.textContent = format(proxy.current.v);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, format]);
  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}

// ------------------------------------------------------------
// useMockUsageSimulator — fires ADD_EVENT every 4s (mock mode)
// ------------------------------------------------------------
export function useMockUsageSimulator(enabled: boolean): void {
  const { dispatch } = useUsage();
  useEffect(() => {
    if (!enabled) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      dispatch({ type: 'ADD_EVENT', point: nextMockUsageEvent(i) });
    }, 4000);
    return () => window.clearInterval(id);
  }, [enabled, dispatch]);
}

// ------------------------------------------------------------
// useCopy — clipboard with transient "copied" flag
// ------------------------------------------------------------
export function useCopy(): { copied: boolean; copy: (text: string) => Promise<boolean> } {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string): Promise<boolean> => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
    return ok;
  };
  return { copied, copy };
}

/** Generic entrance animation for a container's direct children on mount. */
export function useEntrance(deps: unknown[] = []) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const items = scope.current?.querySelectorAll('[data-anim]');
      if (!items) return;
      gsap.from(items, { y: 18, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' });
    },
    { scope, dependencies: deps },
  );
  return scope;
}
