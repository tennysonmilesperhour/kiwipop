'use client';

import { useEffect, useState } from 'react';

interface DropCounterProps {
  // ISO timestamp of the next drop. Defaults to 7 days from mount, matching the demo.
  target?: string;
  label?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function DropCounter({
  target,
  label = 'next drop // gloss 002',
}: DropCounterProps) {
  const [diffParts, setDiffParts] = useState({ d: '00', h: '00', m: '00', s: '00' });

  useEffect(() => {
    const targetDate = target
      ? new Date(target).getTime()
      : Date.now() + 7 * 24 * 60 * 60 * 1000;

    const tick = () => {
      const diff = targetDate - Date.now();
      if (diff <= 0) {
        setDiffParts({ d: '00', h: '00', m: '00', s: '00' });
        return;
      }
      setDiffParts({
        d: pad(Math.floor(diff / 86_400_000)),
        h: pad(Math.floor((diff / 3_600_000) % 24)),
        m: pad(Math.floor((diff / 60_000) % 60)),
        s: pad(Math.floor((diff / 1000) % 60)),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="drop-counter fade-up fade-up-4">
      <div className="drop-counter-label">{label}</div>
      <div className="drop-counter-time" aria-live="polite">
        <span suppressHydrationWarning>{diffParts.d}</span>
        <span>d</span>
        <span suppressHydrationWarning>{diffParts.h}</span>
        <span>h</span>
        <span suppressHydrationWarning>{diffParts.m}</span>
        <span>m</span>
        <span suppressHydrationWarning>{diffParts.s}</span>
        <span>s</span>
      </div>
    </div>
  );
}
