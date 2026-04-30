import Image from 'next/image';
import { DropCounter } from './DropCounter';

export function Hero() {
  return (
    <section className="hero scanlines">
      <div className="kanji-rail">新渋谷 04:17 AM</div>

      <div className="hero-meta fade-up fade-up-1">
        <div>
          <span className="dot"></span>live // new shibuya
        </div>
        <div>est. 2026 · five cal · zero sugar</div>
        <div>drop 001 // kiwi kitty</div>
      </div>

      <div className="sticker sticker-1 fade-up fade-up-3">
        ★ refreshing club lolli
      </div>
      <div className="sticker sticker-2 fade-up fade-up-3">vegan / sugar free</div>
      <div className="sticker sticker-3 fade-up fade-up-3">
        we&apos;re launching soooon
      </div>

      <div className="hero-pop fade-up fade-up-2" aria-hidden="true">
        <Image
          src="/hero-pop.png"
          alt=""
          width={560}
          height={620}
          priority
          sizes="(max-width: 768px) 60vw, 480px"
        />
      </div>

      <div className="hero-wordmark fade-up fade-up-2">
        <h1>
          <span className="glitch" data-text="kiwi pop">
            kiwi pop
          </span>
        </h1>
        <p className="hero-tagline">a little secret in your mouth</p>
        <p className="hero-subtagline">
          refreshing club lolli · sugar free · vegan · 5 cal
        </p>
      </div>

      <div className="hero-bottom">
        <DropCounter label="kiwi kitty drops in" />
        <div className="scroll-cue fade-up fade-up-4">scroll · keep up</div>
      </div>
    </section>
  );
}
