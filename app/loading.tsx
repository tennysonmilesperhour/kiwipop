export default function Loading() {
  return (
    <div className="page-container loading-page" role="status" aria-live="polite">
      <p
        style={{
          color: 'var(--bone)',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          fontFamily: 'var(--mono)',
          fontSize: 12,
        }}
      >
        loading the drop…
      </p>
    </div>
  );
}
