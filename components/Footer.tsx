import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <div className="footer-brand">kiwi pop</div>
        <div style={{ marginTop: '0.5rem', opacity: 0.6 }}>
          © {new Date().getFullYear()} · salt lake · do not eat the wrapper
        </div>
        <div
          style={{
            marginTop: '0.75rem',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/about" className="footer-link">
            story
          </Link>
          <Link href="/find-us" className="footer-link">
            find us
          </Link>
          <Link href="/wholesale" className="footer-link">
            wholesale
          </Link>
          <Link href="/legal/privacy" className="footer-link">
            privacy
          </Link>
          <Link href="/legal/terms" className="footer-link">
            terms
          </Link>
          <Link href="/legal/shipping" className="footer-link">
            shipping
          </Link>
          <Link href="/legal/refund" className="footer-link">
            refunds
          </Link>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div>ig · tiktok · discord</div>
        <div style={{ marginTop: '0.5rem', opacity: 0.6 }}>
          contains functional ingredients · not medical advice
        </div>
        <div style={{ marginTop: '0.5rem', opacity: 0.6 }}>
          <a href="mailto:hello@kiwipop.co" style={{ color: 'var(--lime)' }}>
            hello@kiwipop.co
          </a>
        </div>
      </div>
    </footer>
  );
}
