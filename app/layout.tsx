import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { Navigation } from '@/components/Navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import './globals.css';

const queryClient = new QueryClient();

export const metadata: Metadata = {
  title: 'Kiwi Pop | Party Lollipops',
  description: 'Premium party lollipops for every occasion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navigation />
          <main className="main-container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
