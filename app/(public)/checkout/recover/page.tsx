import type { Metadata } from 'next';
import { RecoverCart } from './RecoverCart';

export const metadata: Metadata = {
  title: 'your cart',
  description: 'restoring your kiwi pop cart.',
  robots: { index: false, follow: false },
};

interface RecoverPageProps {
  searchParams: Promise<{ t?: string }>;
}

export default async function CheckoutRecoverPage(props: RecoverPageProps) {
  const searchParams = await props.searchParams;
  return <RecoverCart token={searchParams.t ?? ''} />;
}
