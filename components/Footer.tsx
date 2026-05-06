import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <div className="footer-brand">kiwi pop&trade;</div>
        <div style={{ marginTop: '0.5rem', opacity: 0.6 }}>
          © {new Date().getFullYear()} kiwi pop · salt lake · do not eat the
          wrapper. all rights reserved.
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
          <Link href="/legal/fda-disclaimer" className="footer-link">
            fda + safety
          </Link>
          <Link href="/legal/accessibility" className="footer-link">
            accessibility
          </Link>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <a
            href="https://www.instagram.com/the.kiwi.pop/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            instagram
          </a>
          <a
            href="https://www.tiktok.com/@the.kiwi.pop"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            tiktok
          </a>
        </div>
        <div style={{ marginTop: '0.5rem', opacity: 0.6 }}>
          contains functional ingredients · not medical advice
        </div>
        <div style={{ marginTop: '0.5rem', opacity: 0.6 }}>
          <a href="mailto:thekiwipop@gmail.com" style={{ color: 'var(--lime)' }}>
            thekiwipop@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
