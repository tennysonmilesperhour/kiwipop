export function Footer() {
  return (
    <footer className="footer">
      <div>
        <div className="footer-brand">kiwi pop</div>
        <div style={{ marginTop: '0.5rem', opacity: 0.6 }}>
          © {new Date().getFullYear()} · new shibuya · do not eat the wrapper
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div>ig · tiktok · discord</div>
        <div style={{ marginTop: '0.5rem', opacity: 0.6 }}>
          contains caffeine · 21+ · not for children
        </div>
      </div>
    </footer>
  );
}
