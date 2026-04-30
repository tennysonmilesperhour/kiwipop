import { HeroMascot } from './HeroMascot';
import { DropCounter } from './DropCounter';

export function Hero() {
  return (
    <section className="hero scanlines">
      <div className="kanji-rail">新渋谷 04:17 AM</div>

      <div className="hero-meta fade-up fade-up-1">
        <div>
          <span className="dot"></span>live // new shibuya
        </div>
        <div>04:17:23 AM</div>
        <div>drop 001 // 800 made</div>
      </div>

      <div className="sticker sticker-1 fade-up fade-up-3">★ 21+ only</div>
      <div className="sticker sticker-2 fade-up fade-up-3">vegan / sugar free</div>
      <div className="sticker sticker-3 fade-up fade-up-3">limited 800/800</div>

      <HeroMascot />

      <div className="hero-wordmark fade-up fade-up-2">
        <h1>
          <span className="glitch" data-text="kiwi pop">
            kiwi pop
          </span>
        </h1>
        <p className="hero-tagline">
          suck on the future · sugar free · 21+
        </p>
      </div>

      <div className="hero-bottom">
        <DropCounter />
        <div className="scroll-cue fade-up fade-up-4">scroll · keep up</div>
      </div>
    </section>
  );
}
