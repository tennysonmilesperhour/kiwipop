'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

interface SiteChromeProps {
  children: ReactNode;
}

const ROUTES_WITH_OWN_CHROME = new Set(['/', '/donate']);

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname();
  const skipChrome = ROUTES_WITH_OWN_CHROME.has(pathname);

  if (skipChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <main className="main-container">{children}</main>
      <Footer />
    </>
  );
}
