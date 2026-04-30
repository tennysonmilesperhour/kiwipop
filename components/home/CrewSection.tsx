interface CrewMember {
  name: string;
  role: string;
  bio: string;
  portrait: React.ReactNode;
}

const CREW: CrewMember[] = [
  {
    name: 'kiwi',
    role: '// front · age 22 forever',
    bio: 'eternally bored at her own party. green hair, glossy lips, never without a pop. the face.',
    portrait: (
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#050510" />
        <path
          d="M 50 110 Q 40 50 100 40 Q 160 50 150 110 L 150 180 L 50 180 Z"
          fill="#a8ff3c"
        />
        <ellipse cx="100" cy="130" rx="45" ry="55" fill="#f4d8c2" />
        <path
          d="M 55 100 Q 100 85 145 100 Q 140 125 100 120 Q 60 125 55 100 Z"
          fill="#a8ff3c"
        />
        <ellipse cx="85" cy="135" rx="6" ry="8" fill="#050510" />
        <ellipse cx="115" cy="135" rx="6" ry="8" fill="#050510" />
        <ellipse cx="100" cy="160" rx="11" ry="4" fill="#ff2d8a" />
      </svg>
    ),
  },
  {
    name: 'neko',
    role: '// dj · plays the after-after',
    bio: 'visor stays on. real eyes never seen. plays only between 4 and 7am. taste? unhinged.',
    portrait: (
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#050510" />
        <path
          d="M 60 100 Q 50 40 100 40 Q 150 40 140 100 L 140 180 L 60 180 Z"
          fill="#1a1a22"
        />
        <polygon points="65,55 55,30 80,50" fill="#1a1a22" />
        <polygon points="135,55 145,30 120,50" fill="#1a1a22" />
        <ellipse cx="100" cy="130" rx="40" ry="50" fill="#f4d8c2" />
        <rect x="60" y="120" width="80" height="20" fill="#00f0ff" opacity="0.85" />
        <rect
          x="60"
          y="120"
          width="80"
          height="20"
          fill="none"
          stroke="#050510"
          strokeWidth="2"
        />
        <ellipse cx="100" cy="160" rx="9" ry="3" fill="#050510" />
      </svg>
    ),
  },
  {
    name: 'lip',
    role: '// messenger · all mouth',
    bio: 'never seen above the chin. sends drops via lipstick smudges on napkins. dating glitch.',
    portrait: (
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#050510" />
        <path
          d="M 30 100 Q 60 70 100 90 Q 140 70 170 100 Q 140 130 100 120 Q 60 130 30 100 Z"
          fill="#ff2d8a"
        />
        <path
          d="M 100 90 Q 100 100 100 120"
          stroke="#a01045"
          strokeWidth="2"
          fill="none"
        />
        <ellipse cx="80" cy="92" rx="18" ry="5" fill="rgba(255,255,255,0.6)" />
        <ellipse cx="125" cy="92" rx="18" ry="5" fill="rgba(255,255,255,0.6)" />
        <ellipse cx="100" cy="115" rx="12" ry="6" fill="#ff5588" />
      </svg>
    ),
  },
  {
    name: 'glitch',
    role: '// chaos · pixelates when emotional',
    bio: 'corrupts when hugged. responsible for every drop announcement going out 4 minutes late. essential.',
    portrait: (
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#050510" />
        <rect x="60" y="60" width="80" height="80" fill="#f4d8c2" />
        <rect x="55" y="65" width="10" height="80" fill="#ff2d8a" opacity="0.6" />
        <rect x="135" y="55" width="10" height="80" fill="#00f0ff" opacity="0.6" />
        <rect x="60" y="90" width="80" height="6" fill="#050510" />
        <rect x="60" y="100" width="80" height="2" fill="#a8ff3c" />
        <rect x="75" y="85" width="14" height="14" fill="#050510" />
        <rect x="111" y="85" width="14" height="14" fill="#050510" />
        <rect x="80" y="120" width="40" height="6" fill="#ff2d8a" />
        <rect x="60" y="140" width="80" height="3" fill="#fff" opacity="0.3" />
        <rect x="60" y="150" width="80" height="3" fill="#fff" opacity="0.2" />
      </svg>
    ),
  },
];

export function CrewSection() {
  return (
    <section className="crew-section" id="crew">
      <div className="section-header">
        <div className="section-title">
          <span className="num">/02</span>the crew
        </div>
        <div className="section-meta">fictional · always · they live here now</div>
      </div>

      <div className="crew-grid">
        {CREW.map((member) => (
          <div className="crew-card" key={member.name}>
            <div className="crew-portrait">{member.portrait}</div>
            <div className="crew-name">{member.name}</div>
            <div className="crew-role">{member.role}</div>
            <div className="crew-bio">{member.bio}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
