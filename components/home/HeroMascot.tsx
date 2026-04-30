export function HeroMascot() {
  return (
    <svg
      className="hero-mascot fade-up fade-up-2"
      viewBox="0 0 400 600"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hair" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#a8ff3c" />
          <stop offset="100%" stopColor="#5fcc18" />
        </linearGradient>
        <linearGradient id="skin" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f4d8c2" />
          <stop offset="100%" stopColor="#d8a98a" />
        </linearGradient>
        <radialGradient id="pop" cx="0.35" cy="0.35">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="40%" stopColor="#ff2d8a" />
          <stop offset="100%" stopColor="#a01045" />
        </radialGradient>
      </defs>
      <path
        d="M 100 220 Q 80 100 200 80 Q 320 100 300 220 L 300 350 L 100 350 Z"
        fill="url(#hair)"
      />
      <ellipse cx="200" cy="260" rx="90" ry="110" fill="url(#skin)" />
      <path
        d="M 110 200 Q 200 170 290 200 Q 280 250 200 240 Q 120 250 110 200 Z"
        fill="url(#hair)"
      />
      <ellipse cx="170" cy="270" rx="12" ry="16" fill="#050505" />
      <ellipse cx="230" cy="270" rx="12" ry="16" fill="#050505" />
      <ellipse cx="167" cy="265" rx="3" ry="4" fill="#fff" />
      <ellipse cx="227" cy="265" rx="3" ry="4" fill="#fff" />
      <rect x="155" y="248" width="30" height="3" fill="#050505" rx="1" />
      <rect x="215" y="248" width="30" height="3" fill="#050505" rx="1" />
      <ellipse cx="200" cy="320" rx="22" ry="8" fill="#ff2d8a" />
      <rect x="198" y="180" width="4" height="140" fill="#f4f0e8" />
      <circle cx="200" cy="170" r="55" fill="url(#pop)" />
      <ellipse
        cx="180"
        cy="150"
        rx="14"
        ry="20"
        fill="rgba(255,255,255,0.5)"
        transform="rotate(-30 180 150)"
      />
      <path
        d="M 50 380 Q 200 360 350 380 L 360 600 L 40 600 Z"
        fill="#050505"
      />
      <text
        x="200"
        y="450"
        textAnchor="middle"
        fill="#a8ff3c"
        fontFamily="JetBrains Mono"
        fontSize="20"
        fontWeight="700"
        letterSpacing="3"
      >
        KIWI
      </text>
    </svg>
  );
}
