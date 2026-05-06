'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';

type Lang = 'en' | 'es';

type QrCodeConstructor = new (
  el: Element,
  opts: {
    text: string;
    width?: number;
    height?: number;
    colorDark?: string;
    colorLight?: string;
    correctLevel?: number;
  },
) => unknown;

interface OnepagerProps {
  fontVars: string;
}

export function Onepager({ fontVars }: OnepagerProps) {
  const [lang, setLang] = useState<Lang>('en');
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [qrReady, setQrReady] = useState(false);
  const [specOpen, setSpecOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement | null>(null);
  const qrRendered = useRef(false);

  // Restore lang from localStorage / browser preference once on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kp-lang');
      if (saved === 'es' || saved === 'en') {
        setLang(saved);
        return;
      }
    } catch {
      /* ignore */
    }
    if ((navigator.language || '').toLowerCase().startsWith('es')) {
      setLang('es');
    }
  }, []);

  // Persist lang on change.
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('kp-lang', lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  // QR encodes the live page URL.
  useEffect(() => {
    setQrUrl(window.location.href.split('#')[0]);
  }, []);

  // Render the QR once both the CDN script has loaded and the URL is known.
  useEffect(() => {
    if (!qrReady || !qrUrl || !qrRef.current || qrRendered.current) return;
    const QRCode = (window as unknown as { QRCode?: QrCodeConstructor & { CorrectLevel?: { M?: number } } })
      .QRCode;
    if (!QRCode) return;
    qrRef.current.innerHTML = '';
    new QRCode(qrRef.current, {
      text: qrUrl,
      width: 120,
      height: 120,
      colorDark: '#060610',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel?.M ?? 0,
    });
    qrRendered.current = true;
  }, [qrReady, qrUrl]);

  // Lock body scroll while modal is open + handle Escape.
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [modalOpen]);

  const toggleFaq = useCallback((idx: number) => {
    setOpenFaqs((s) => {
      const next = new Set(s);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const openModal = () => {
    setSubmitted(false);
    setModalOpen(true);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setModalOpen(false);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    // eslint-disable-next-line no-console
    console.log('Vendor application submitted:', data);
    const subject = encodeURIComponent(
      'Wholesale vendor application — ' + (data.trading_name || ''),
    );
    const bodyLines = Object.entries(data)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    const mailto = `mailto:thekiwipop@gmail.com?subject=${subject}&body=${encodeURIComponent(bodyLines)}`;
    window.location.href = mailto;
    setSubmitted(true);
    form.reset();
  };

  const da = (l: Lang) => (l === lang ? '' : undefined);
  // For elements with data-lang where we want data-active when matching the active lang
  const langProps = (l: Lang) => ({
    'data-lang': l,
    ...(l === lang ? { 'data-active': '' } : {}),
  });

  return (
    <div className={`kpw-bcn ${fontVars}`}>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
        strategy="afterInteractive"
        onLoad={() => setQrReady(true)}
      />

      {/* STICKY TOP BAR */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="logo">
            KIWI POP <span className="jp">舐</span>
          </div>
          <div className="right">
            <span className="live">
              <span {...langProps('en')}>DROP 001 · LIVE</span>
              <span {...langProps('es')}>DROP 001 · ACTIVO</span>
            </span>
            <div className="lang-toggle" role="tablist">
              <button
                type="button"
                className={lang === 'en' ? 'active' : ''}
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={lang === 'es' ? 'active' : ''}
                onClick={() => setLang('es')}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="page">
        {/* PRODUCT PORTFOLIO */}
        <section className="portfolio reveal" aria-label="Product portfolio">
          <div className="portfolio-grid">
            {PORTFOLIO_IMAGES.map((img) => (
              <div key={img.src} className="portfolio-tile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} loading="lazy" />
                <span className="portfolio-cap">{img.caption}</span>
              </div>
            ))}
          </div>
        </section>

        {/* HERO */}
        <section className="hero reveal">
          <div className="eyebrow">
            <span {...langProps('en')}>A FUNCTIONAL LOLLIPOP · FOR CLUBS &amp; EVENTS</span>
            <span {...langProps('es')}>UNA PIRULETA FUNCIONAL · PARA SALAS Y EVENTOS</span>
          </div>

          <h1 className="hero-title" {...langProps('en')}>
            A small thing<br />that does <span className="accent">something</span>.<span className="jp">舐</span>
          </h1>
          <h1 className="hero-title" {...langProps('es')}>
            Algo pequeño<br />que hace <span className="accent">algo</span>.<span className="jp">舐</span>
          </h1>

          <p className="hero-sub" {...langProps('en')}>
            <strong>Kiwi Pop is a functional lollipop, made for the night.</strong>
            {' '}Less than 1g of sugar. Around 35 calories. Vegan. A measured blend of botanicals and electrolytes (jambu, theobromine, ginseng, B12, magnesium, taurine, electrolytes), thought through for long hours and warm rooms. Honest about what&apos;s in it. Honest about what it isn&apos;t.
          </p>
          <p className="hero-sub" {...langProps('es')}>
            <strong>Kiwi Pop es una piruleta funcional, pensada para la noche.</strong>
            {' '}Menos de 1g de azúcar. Alrededor de 35 calorías. Vegana. Una mezcla medida de plantas y electrolitos (jambú, teobromina, ginseng, B12, magnesio, taurina, electrolitos), pensada para horas largas y salas con ritmo. Transparente con lo que lleva. Transparente con lo que no.
          </p>

          <div className="hero-stats">
            <div className="stat">
              <div className="num">&lt;1g</div>
              <div className="lbl">
                <span {...langProps('en')}>Sugar</span>
                <span {...langProps('es')}>Azúcar</span>
              </div>
            </div>
            <div className="stat">
              <div className="num">~35</div>
              <div className="lbl">
                <span {...langProps('en')}>Calories</span>
                <span {...langProps('es')}>Calorías</span>
              </div>
            </div>
            <div className="stat">
              <div className="num">7+</div>
              <div className="lbl">
                <span {...langProps('en')}>Functionals</span>
                <span {...langProps('es')}>Activos</span>
              </div>
            </div>
            <div className="stat">
              <div className="num">100%</div>
              <div className="lbl">
                <span {...langProps('en')}>Vegan</span>
                <span {...langProps('es')}>Vegana</span>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT IT BRINGS */}
        <section className="section reveal d1">
          <div className="section-header">
            <span className="section-num">01</span>
            <h2 className="section-title">
              <span {...langProps('en')}>What it brings to your <span className="accent">floor</span>.</span>
              <span {...langProps('es')}>Lo que aporta a tu <span className="accent">sala</span>.</span>
            </h2>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <h3 {...langProps('en')}>Looks like fun, not medicine.</h3>
              <h3 {...langProps('es')}>Parece diversión, no medicina.</h3>
              <p {...langProps('en')}>Bright wrapper, edible mica glitter, a swirl on a stick. It reads as a treat. The functional payload is real, but the moment is light.</p>
              <p {...langProps('es')}>Envoltorio vivo, brillo de mica comestible, espiral en un palo. Se lee como un capricho. La carga funcional es real, pero el momento es ligero.</p>
            </div>
            <div className="why-card">
              <h3 {...langProps('en')}>Designed for long nights.</h3>
              <h3 {...langProps('es')}>Pensada para noches largas.</h3>
              <p {...langProps('en')}>Magnesium for the legs. Electrolytes for sweat. Theobromine and B12 for steady energy. A small mouth tingle from jambu that wakes the palate. The chemistry of a long night, in a lollipop.</p>
              <p {...langProps('es')}>Magnesio para las piernas. Electrolitos para el sudor. Teobromina y B12 para una energía estable. Un cosquilleo en la boca por el jambú que despierta el paladar. La química de una noche larga, en una piruleta.</p>
            </div>
            <div className="why-card">
              <h3 {...langProps('en')}>Sits next to what you already sell.</h3>
              <h3 {...langProps('es')}>Convive con lo que ya tenéis.</h3>
              <p {...langProps('en')}>Counter-display ready. No fridge. Individually wrapped. We won&apos;t pretend to know your numbers better than you do; we&apos;d rather hear how it actually performs on your floor than guess at it from outside.</p>
              <p {...langProps('es')}>Lista para mostrador. Sin frío. Envasada individualmente. No vamos a pretender que conocemos vuestros números mejor que vosotros. Preferimos escuchar cómo funciona en vuestra sala antes que adivinarlo desde fuera.</p>
            </div>
          </div>
        </section>

        {/* WHAT'S INSIDE */}
        <section className="section reveal d2">
          <div className="section-header">
            <span className="section-num">02</span>
            <h2 className="section-title">
              <span {...langProps('en')}>What&apos;s <span className="accent">inside</span>.</span>
              <span {...langProps('es')}>Qué <span className="accent">lleva</span>.</span>
            </h2>
          </div>
          <div className="inside-grid">
            <div className="ing featured">
              <span className="name">
                <span {...langProps('en')}>Jambu extract</span>
                <span {...langProps('es')}>Extracto de jambú</span>
              </span>
              <span className="dose">~30 mg*</span>
              <span className="role">
                <span {...langProps('en')}>mouth tingle, salivation</span>
                <span {...langProps('es')}>cosquilleo, salivación</span>
              </span>
            </div>
            <div className="ing">
              <span className="name">Theobromine</span>
              <span className="dose">175 mg*</span>
              <span className="role">
                <span {...langProps('en')}>clean lift</span>
                <span {...langProps('es')}>empuje limpio</span>
              </span>
            </div>
            <div className="ing">
              <span className="name">Ginseng</span>
              <span className="dose">150 mg*</span>
              <span className="role">
                <span {...langProps('en')}>steady wake</span>
                <span {...langProps('es')}>vigilia estable</span>
              </span>
            </div>
            <div className="ing">
              <span className="name">
                <span {...langProps('en')}>Magnesium glycinate</span>
                <span {...langProps('es')}>Magnesio glicinato</span>
              </span>
              <span className="dose">300 mg*</span>
              <span className="role">
                <span {...langProps('en')}>muscle support</span>
                <span {...langProps('es')}>soporte muscular</span>
              </span>
            </div>
            <div className="ing">
              <span className="name">Taurine</span>
              <span className="dose">250 mg*</span>
              <span className="role">
                <span {...langProps('en')}>focus current</span>
                <span {...langProps('es')}>concentración</span>
              </span>
            </div>
            <div className="ing">
              <span className="name">
                <span {...langProps('en')}>Electrolytes</span>
                <span {...langProps('es')}>Electrolitos</span>
              </span>
              <span className="dose">250 mg*</span>
              <span className="role">
                <span {...langProps('en')}>sodium + potassium</span>
                <span {...langProps('es')}>sodio + potasio</span>
              </span>
            </div>
            <div className="ing">
              <span className="name">
                <span {...langProps('en')}>B12 (methyl)</span>
                <span {...langProps('es')}>B12 (metilada)</span>
              </span>
              <span className="dose">1 mg*</span>
              <span className="role">
                <span {...langProps('en')}>brain on</span>
                <span {...langProps('es')}>claridad mental</span>
              </span>
            </div>
            <div className="ing">
              <span className="name">
                <span {...langProps('en')}>Blue spirulina</span>
                <span {...langProps('es')}>Espirulina azul</span>
              </span>
              <span className="dose">125 mg*</span>
              <span className="role">
                <span {...langProps('en')}>natural color</span>
                <span {...langProps('es')}>color natural</span>
              </span>
            </div>
            <div className="ing">
              <span className="name">
                <span {...langProps('en')}>Xylitol base</span>
                <span {...langProps('es')}>Base de xilitol</span>
              </span>
              <span className="dose">~1.2 g*</span>
              <span className="role">
                <span {...langProps('en')}>tooth-friendly sweetener</span>
                <span {...langProps('es')}>edulcorante dental</span>
              </span>
            </div>
          </div>

          <div className="estimate-note">
            <span {...langProps('en')}>
              <strong>* On the formula.</strong> The European version of Kiwi Pop is still being finalized. Doses shown above are current estimates based on the US version and the standard food-flavor use of jambu extract; the exact final amounts will be confirmed once we complete EU regulatory review and a small-batch trial. We&apos;ll share the final spec sheet with you in writing before any wholesale order is fulfilled.
            </span>
            <span {...langProps('es')}>
              <strong>* Sobre la fórmula.</strong> La versión europea de Kiwi Pop todavía se está terminando de definir. Las dosis indicadas son estimaciones actuales basadas en la versión estadounidense y en el uso habitual del extracto de jambú como aromatizante alimentario. Las cantidades definitivas se confirmarán cuando completemos la revisión regulatoria en la UE y una prueba de lote pequeño. Compartiremos contigo la ficha técnica definitiva por escrito antes de servir cualquier pedido al por mayor.
            </span>
          </div>
        </section>

        {/* TERMS */}
        <section className="section reveal d3">
          <div className="section-header">
            <span className="section-num">03</span>
            <h2 className="section-title">
              <span {...langProps('en')}>The <span className="accent">terms</span>.</span>
              <span {...langProps('es')}>Las <span className="accent">condiciones</span>.</span>
            </h2>
          </div>
          <table className="deal-table">
            <tbody>
              <tr>
                <td>
                  <span {...langProps('en')}>Format</span>
                  <span {...langProps('es')}>Formato</span>
                </td>
                <td>
                  <span {...langProps('en')}>Individually wrapped, branded, around 10g per pop.<span className="small">No refrigeration. Ready for counter display.</span></span>
                  <span {...langProps('es')}>Envasada individualmente, personalizada, alrededor de 10g por unidad.<span className="small">Sin necesidad de frío. Lista para mostrador.</span></span>
                </td>
              </tr>
              <tr>
                <td>
                  <span {...langProps('en')}>Suggested retail</span>
                  <span {...langProps('es')}>Precio sugerido</span>
                </td>
                <td>
                  <span {...langProps('en')}>€5 single · €25 / 6-pack · €60 / 20-pack<span className="small">A starting point only. You set the final price for your floor.</span></span>
                  <span {...langProps('es')}>5 € unidad · 25 € pack de 6 · 60 € pack de 20<span className="small">Solo un punto de partida. Tú decides el precio final para tu sala.</span></span>
                </td>
              </tr>
              <tr>
                <td>
                  <span {...langProps('en')}>Wholesale price</span>
                  <span {...langProps('es')}>Precio mayorista</span>
                </td>
                <td>
                  <span {...langProps('en')}>To be confirmed in writing<span className="small">We&apos;re finalizing EU production costs. We&apos;ll share the wholesale price as soon as the EU formula and co-packer are confirmed, before asking for any commitment.</span></span>
                  <span {...langProps('es')}>Por confirmar por escrito<span className="small">Estamos terminando de cerrar los costes de producción en la UE. Compartiremos el precio mayorista en cuanto la fórmula europea y el envasador estén confirmados, antes de pedir ningún compromiso.</span></span>
                </td>
              </tr>
              <tr>
                <td>
                  <span {...langProps('en')}>Minimum order</span>
                  <span {...langProps('es')}>Pedido mínimo</span>
                </td>
                <td>
                  <span {...langProps('en')}>To be agreed per partner<span className="small">We&apos;d rather understand your floor&apos;s pace before fixing a number that doesn&apos;t fit it.</span></span>
                  <span {...langProps('es')}>A acordar con cada socio<span className="small">Preferimos entender el ritmo de vuestra sala antes de fijar un número que no le encaje.</span></span>
                </td>
              </tr>
              <tr>
                <td>
                  <span {...langProps('en')}>Delivery date</span>
                  <span {...langProps('es')}>Fecha de entrega</span>
                </td>
                <td>
                  <span {...langProps('en')}>Not yet confirmed<span className="small">EU production is in progress. We don&apos;t have a delivery date yet, and we&apos;d rather say so than promise something we can&apos;t hit. The founding-partner program below is how early venues stay first in line for the first batch when it lands.</span></span>
                  <span {...langProps('es')}>Pendiente de confirmar<span className="small">La producción europea está en marcha. Aún no tenemos fecha de entrega, y preferimos decirlo así antes que prometer algo que no podamos cumplir. El programa de socios fundadores que aparece abajo es la forma en la que las primeras salas quedan reservadas para el primer lote cuando llegue.</span></span>
                </td>
              </tr>
              <tr>
                <td>
                  <span {...langProps('en')}>Payment</span>
                  <span {...langProps('es')}>Pago</span>
                </td>
                <td>
                  <span {...langProps('en')}>50% deposit on PO, 50% on delivery<span className="small">Net-30 terms available from the second order onward.</span></span>
                  <span {...langProps('es')}>50% por adelantado al pedido, 50% en la entrega<span className="small">Pago a 30 días disponible a partir del segundo pedido.</span></span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* FOUNDING PARTNERS */}
        <section className="section reveal d3">
          <div className="section-header">
            <span className="section-num">04</span>
            <h2 className="section-title">
              <span {...langProps('en')}>Founding <span className="accent">partner</span> program.</span>
              <span {...langProps('es')}>Programa de socios <span className="accent">fundadores</span>.</span>
            </h2>
          </div>
          <div className="early">
            <h3 {...langProps('en')}>The first <span className="accent">five</span> Barcelona venues.</h3>
            <h3 {...langProps('es')}>Las primeras <span className="accent">cinco</span> salas de Barcelona.</h3>

            <p {...langProps('en')}>
              We&apos;re choosing the first five Barcelona venues carefully. The idea is simple: a small group of partners we work closely with through the launch, who help us get the EU version right, and who keep founding-partner terms once we&apos;re at scale. There&apos;s no commitment to a volume number yet. What we&apos;re asking for is a place in line and a real conversation.
            </p>
            <p {...langProps('es')}>
              Estamos eligiendo con cuidado las primeras cinco salas de Barcelona. La idea es sencilla: un grupo reducido de socios con los que trabajamos de cerca durante el lanzamiento, que nos ayudan a afinar la versión europea y que mantienen las condiciones de socio fundador cuando crezcamos. De momento no pedimos compromiso de volumen. Solo un sitio en la lista y una conversación real.
            </p>

            <ul {...langProps('en')}>
              <li><strong>Founding-partner pricing</strong>, locked for 18 months from launch</li>
              <li><strong>Free sample case</strong> for staff and a soft-launch night</li>
              <li><strong>A launch night</strong> with Kiwi present, when you want one</li>
              <li><strong>Early access</strong> to new flavors before public release</li>
              <li><strong>Listed</strong> on the kiwipop.fun map, if you&apos;d like</li>
              <li><strong>First in line</strong> when the EU stock lands</li>
            </ul>
            <ul {...langProps('es')}>
              <li><strong>Precio de socio fundador</strong>, asegurado durante 18 meses desde el lanzamiento</li>
              <li><strong>Caja de muestras gratuita</strong> para el equipo y una noche de prelanzamiento</li>
              <li><strong>Una noche de lanzamiento</strong> con Kiwi en la sala, cuando os venga bien</li>
              <li><strong>Acceso anticipado</strong> a sabores nuevos antes del lanzamiento público</li>
              <li><strong>Aparición</strong> en el mapa de kiwipop.fun, si lo deseáis</li>
              <li><strong>Prioridad</strong> cuando llegue el primer stock europeo</li>
            </ul>
          </div>
        </section>

        {/* FOUNDERS */}
        <section className="section reveal d4">
          <div className="section-header">
            <span className="section-num">05</span>
            <h2 className="section-title">
              <span {...langProps('en')}>Who&apos;s <span className="accent">behind</span> it.</span>
              <span {...langProps('es')}>Quién está <span className="accent">detrás</span>.</span>
            </h2>
          </div>
          <div className="founders">
            <div className="founder">
              <div className="founder-photo kiwi">舐</div>
              <div className="founder-text">
                <h4>Kiwi</h4>
                <div className="role">
                  <span {...langProps('en')}>CO-FOUNDER · BARCELONA</span>
                  <span {...langProps('es')}>COFUNDADORA · BARCELONA</span>
                </div>
                <p {...langProps('en')}>
                  Kiwi built this product from inside the scene. Years of helping friends and strangers get back to baseline at festivals and after-hours, using food, electrolytes, and the right botanicals. She&apos;s in Barcelona now and is happy to come by your venue, listen, and leave a sample case.
                </p>
                <p {...langProps('es')}>
                  Kiwi ha desarrollado este producto desde dentro de la escena. Años ayudando a amigos y a desconocidos a volver a su sitio en festivales y afters, con comida, electrolitos y las plantas adecuadas. Está en Barcelona ahora y le encantará pasarse por vuestra sala, escuchar y dejar una caja de muestra.
                </p>
              </div>
            </div>
            <div className="founder">
              <div className="founder-photo tennyson">T</div>
              <div className="founder-text">
                <h4>Tennyson</h4>
                <div className="role">
                  <span {...langProps('en')}>CO-FOUNDER · FORMULATOR</span>
                  <span {...langProps('es')}>COFUNDADOR · FORMULADOR</span>
                </div>
                <p {...langProps('en')}>
                  Tennyson is the formulator. A long history of building functional food products, tropical snacks, and party-recovery foods that taste good, work honestly, and don&apos;t pretend to be something they&apos;re not. The dosing in every Kiwi Pop is his work, tuned through years of small-batch trial and error.
                </p>
                <p {...langProps('es')}>
                  Tennyson es el formulador. Una larga trayectoria desarrollando alimentos funcionales, snacks tropicales y comidas de recuperación para fiestas, con buen sabor, efectos honestos y sin pretender ser lo que no son. La dosificación de cada Kiwi Pop es trabajo suyo, afinado durante años de pruebas en lotes pequeños.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section reveal d4">
          <div className="section-header">
            <span className="section-num">06</span>
            <h2 className="section-title">
              <span {...langProps('en')}>Common <span className="accent">questions</span>.</span>
              <span {...langProps('es')}>Preguntas <span className="accent">frecuentes</span>.</span>
            </h2>
          </div>

          {FAQS.map((faq, idx) => (
            <div key={idx} className={`faq-item ${openFaqs.has(idx) ? 'open' : ''}`}>
              <div
                className="faq-q"
                role="button"
                tabIndex={0}
                onClick={() => toggleFaq(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFaq(idx);
                  }
                }}
              >
                <span {...langProps('en')}>{faq.qEn}</span>
                <span {...langProps('es')}>{faq.qEs}</span>
              </div>
              <div className="faq-a">
                <p {...langProps('en')} dangerouslySetInnerHTML={{ __html: faq.aEn }} />
                <p {...langProps('es')} dangerouslySetInnerHTML={{ __html: faq.aEs }} />
              </div>
            </div>
          ))}
        </section>

        {/* SPEC SHEET */}
        <section className="section reveal d4">
          <div className="section-header">
            <span className="section-num">07</span>
            <h2 className="section-title">
              <span {...langProps('en')}>Spec sheet.</span>
              <span {...langProps('es')}>Ficha técnica.</span>
            </h2>
          </div>
          <p className="spec-intro" {...langProps('en')}>
            The technical document your compliance team will want to see. Most fields are estimates while we finalize the EU formula; we mark which are confirmed and which are pending.
          </p>
          <p className="spec-intro" {...langProps('es')}>
            El documento técnico que querrá ver vuestro equipo de cumplimiento. La mayoría de campos son estimaciones mientras cerramos la fórmula europea; indicamos cuáles están confirmados y cuáles pendientes.
          </p>
          <button
            type="button"
            className="spec-toggle"
            onClick={() => setSpecOpen((s) => !s)}
            aria-expanded={specOpen}
            aria-controls="spec-sheet"
          >
            <span {...langProps('en')}>
              {specOpen ? 'Hide spec sheet ↑' : 'View spec sheet ↓'}
            </span>
            <span {...langProps('es')}>
              {specOpen ? 'Ocultar ficha técnica ↑' : 'Ver ficha técnica ↓'}
            </span>
          </button>
          <div
            id="spec-sheet"
            className={`spec-content ${specOpen ? 'open' : ''}`}
            aria-hidden={!specOpen}
          >
            {SPEC_GROUPS.map((group, gi) => (
              <div key={gi} className="spec-group">
                <div className="spec-group-h">
                  <span {...langProps('en')}>{group.headingEn}</span>
                  <span {...langProps('es')}>{group.headingEs}</span>
                </div>
                {group.rows.map((row, ri) => (
                  <div key={ri} className="spec-row">
                    <div className="spec-label">
                      <span {...langProps('en')}>{row.labelEn}</span>
                      <span {...langProps('es')}>{row.labelEs}</span>
                    </div>
                    <div className="spec-val">
                      <span className="text">
                        <span {...langProps('en')}>{row.valueEn}</span>
                        <span {...langProps('es')}>{row.valueEs}</span>
                      </span>
                      <span className={`spec-badge ${row.status}`}>
                        <span {...langProps('en')}>{STATUS_LABELS.en[row.status]}</span>
                        <span {...langProps('es')}>{STATUS_LABELS.es[row.status]}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <div className="spec-group">
              <div className="spec-group-h">
                <span {...langProps('en')}>Documentation available on request</span>
                <span {...langProps('es')}>Documentación disponible bajo petición</span>
              </div>
              <p className="spec-prose" {...langProps('en')}>
                The following will be provided to founding partners ahead of first delivery: <strong>certificate of analysis, supplier specifications, allergen statement, nutritional analysis (lab-verified), packaging compliance documentation, and product images for marketing use.</strong>
              </p>
              <p className="spec-prose" {...langProps('es')}>
                Lo siguiente se entregará a los socios fundadores antes de la primera entrega: <strong>certificado de análisis, especificaciones de proveedor, declaración de alérgenos, análisis nutricional (verificado en laboratorio), documentación de cumplimiento del envase e imágenes del producto para uso en marketing.</strong>
              </p>
            </div>

            <p className="spec-final" {...langProps('en')}>
              All values marked <strong>ESTIMATE</strong> are subject to change before final EU release. The complete confirmed spec sheet will be issued in writing before any wholesale order is fulfilled.
            </p>
            <p className="spec-final" {...langProps('es')}>
              Todos los valores marcados como <strong>ESTIMACIÓN</strong> están sujetos a cambios antes del lanzamiento final en la UE. La ficha técnica definitiva confirmada se emitirá por escrito antes de servir cualquier pedido al por mayor.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="cta reveal d4">
          <div className="cta-eyebrow">
            <span {...langProps('en')}>NEXT STEP</span>
            <span {...langProps('es')}>SIGUIENTE PASO</span>
          </div>
          <h2 {...langProps('en')}>Send a vendor application.</h2>
          <h2 {...langProps('es')}>Enviar una solicitud.</h2>
          <p className="cta-sub" {...langProps('en')}>
            A short form. The fields are tuned for venues importing from outside the EU, so it asks for your tax IDs and customs information up front. Nothing on the form commits you to a volume or a price — it gives us what we need to come back with a clear proposal for your floor.
          </p>
          <p className="cta-sub" {...langProps('es')}>
            Un formulario breve. Los campos están pensados para salas que importan de fuera de la UE, así que se piden los datos fiscales y aduaneros desde el principio. Nada del formulario te compromete a un volumen ni a un precio: nos da lo que necesitamos para volver con una propuesta clara para vuestra sala.
          </p>
          <button type="button" className="btn" onClick={openModal}>
            <span {...langProps('en')}>Send wholesale vendor application →</span>
            <span {...langProps('es')}>Enviar solicitud de mayorista →</span>
          </button>

          <div className="contact">
            <div className="item">
              <div className="lbl">
                <span {...langProps('en')}>Wholesale email</span>
                <span {...langProps('es')}>Email mayorista</span>
              </div>
              <div className="val">
                <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a>
              </div>
            </div>
            <div className="item">
              <div className="lbl">Kiwi · WhatsApp</div>
              <div className="val">
                <a href="https://wa.me/18083718666">+1 808 371 8666</a>
              </div>
            </div>
            <div className="item">
              <div className="lbl">Web</div>
              <div className="val">
                <a href="https://kiwipop.fun" target="_blank" rel="noopener noreferrer">
                  kiwipop.fun
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* QR CODE */}
        <section className="qr-block reveal">
          <div className="qr-code" ref={qrRef} aria-hidden="true" />
          <div className="qr-text">
            <h3 {...langProps('en')}>Take this with you.</h3>
            <h3 {...langProps('es')}>Llévatelo contigo.</h3>
            <p {...langProps('en')}>Scan to open this page on your phone. Share it with the rest of your team, or come back to it later when you&apos;re ready.</p>
            <p {...langProps('es')}>Escanea para abrir esta página en tu móvil. Compártela con el resto de tu equipo o vuelve a ella cuando estéis listos.</p>
            <div className="url">{qrUrl}</div>
          </div>
        </section>

        {/* FOOTER */}
        <div className="foot">
          <span>© KIWI POP 2026</span>
          <span>
            <span {...langProps('en')}>DROP 001 · MFD SALT LAKE</span>
            <span {...langProps('es')}>DROP 001 · ELABORADO EN SALT LAKE</span>
          </span>
          <span>舐 一下</span>
          <p className="disclaimer">
            <span {...langProps('en')}>
              Not for use by persons under 18. Pregnant or nursing persons should consult a healthcare professional before consuming. The European version of Kiwi Pop is still in development; ingredient amounts shown above are estimates and may change before final EU release. The final formula will be confirmed in writing before any wholesale order is fulfilled. These statements have not been evaluated by any regulatory body.
            </span>
            <span {...langProps('es')}>
              No apto para menores de 18 años. Personas embarazadas o en período de lactancia deben consultar con un profesional sanitario antes de consumir. La versión europea de Kiwi Pop está aún en desarrollo; las cantidades de ingredientes indicadas son estimaciones y pueden variar antes del lanzamiento final en la UE. La fórmula definitiva se confirmará por escrito antes de servir cualquier pedido mayorista. Estas declaraciones no han sido evaluadas por ningún organismo regulador.
            </span>
          </p>
        </div>
      </div>

      {/* VENDOR APPLICATION MODAL */}
      <div
        className={`modal-overlay ${modalOpen ? 'active' : ''}`}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal">
          <button
            type="button"
            className="modal-close"
            onClick={() => setModalOpen(false)}
            aria-label="Close"
          >
            ×
          </button>

          {!submitted ? (
            <div>
              <h2 {...langProps('en')}>Wholesale vendor application</h2>
              <h2 {...langProps('es')}>Solicitud de mayorista</h2>

              <p className="modal-sub" {...langProps('en')}>
                About 5 minutes. We use this to build a clear proposal that fits your floor and clears Spanish customs cleanly when the EU stock is ready.
              </p>
              <p className="modal-sub" {...langProps('es')}>
                Unos 5 minutos. Usamos esta información para preparar una propuesta clara que encaje con vuestra sala y pase la aduana española sin complicaciones cuando el stock europeo esté listo.
              </p>

              <form id="vendor-form" onSubmit={handleSubmit}>
                {/* BUSINESS DETAILS */}
                <div className="modal-section-head">
                  <span {...langProps('en')}>Business details / Datos de la empresa</span>
                  <span {...langProps('es')}>Datos de la empresa</span>
                </div>

                <div className="field">
                  <label>
                    <span {...langProps('en')}>Registered business name (razón social) <span className="req">*</span></span>
                    <span {...langProps('es')}>Razón social <span className="req">*</span></span>
                  </label>
                  <input type="text" name="razon_social" required />
                  <span className="hint" {...langProps('en')}>The legal name on your tax registration, which can differ from the venue&apos;s trading name.</span>
                  <span className="hint" {...langProps('es')}>El nombre legal que figura en tu registro fiscal, que puede ser distinto del nombre comercial de la sala.</span>
                </div>

                <div className="field">
                  <label>
                    <span {...langProps('en')}>Trading name / venue name <span className="req">*</span></span>
                    <span {...langProps('es')}>Nombre comercial / sala <span className="req">*</span></span>
                  </label>
                  <input type="text" name="trading_name" required />
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>
                      <span {...langProps('en')}>Legal form <span className="req">*</span></span>
                      <span {...langProps('es')}>Forma jurídica <span className="req">*</span></span>
                    </label>
                    <select name="legal_form" required defaultValue="">
                      <option value="">—</option>
                      <option>Autónomo</option>
                      <option>Sociedad Limitada (SL)</option>
                      <option>Sociedad Anónima (SA)</option>
                      <option>Sociedad Civil</option>
                      <option>Comunidad de Bienes</option>
                      <option {...langProps('en')}>Other</option>
                      <option {...langProps('es')}>Otro</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>
                      <span {...langProps('en')}>Venue type <span className="req">*</span></span>
                      <span {...langProps('es')}>Tipo de local <span className="req">*</span></span>
                    </label>
                    <select name="venue_type" required defaultValue="">
                      <option value="">—</option>
                      <option {...langProps('en')}>Nightclub</option>
                      <option {...langProps('es')}>Discoteca</option>
                      <option {...langProps('en')}>Bar / lounge</option>
                      <option {...langProps('es')}>Bar / lounge</option>
                      <option {...langProps('en')}>Festival / event</option>
                      <option {...langProps('es')}>Festival / evento</option>
                      <option {...langProps('en')}>Restaurant</option>
                      <option {...langProps('es')}>Restaurante</option>
                      <option {...langProps('en')}>Retail</option>
                      <option {...langProps('es')}>Comercio minorista</option>
                      <option {...langProps('en')}>Distributor / wholesaler</option>
                      <option {...langProps('es')}>Distribuidor / mayorista</option>
                      <option {...langProps('en')}>Other</option>
                      <option {...langProps('es')}>Otro</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>
                    <span {...langProps('en')}>Fiscal address (domicilio fiscal) <span className="req">*</span></span>
                    <span {...langProps('es')}>Domicilio fiscal <span className="req">*</span></span>
                  </label>
                  <input type="text" name="fiscal_address" placeholder="Calle, número, código postal, ciudad" required />
                  <span className="hint" {...langProps('en')}>The address registered with Hacienda for tax purposes, not the venue&apos;s street address.</span>
                  <span className="hint" {...langProps('es')}>La dirección registrada en Hacienda a efectos fiscales, no la dirección de la sala.</span>
                </div>

                <div className="field">
                  <label>
                    <span {...langProps('en')}>Venue address (if different)</span>
                    <span {...langProps('es')}>Dirección del local (si es distinta)</span>
                  </label>
                  <input type="text" name="venue_address" />
                </div>

                {/* TAX & CUSTOMS */}
                <div className="modal-section-head">
                  <span {...langProps('en')}>Tax &amp; customs / Identificación fiscal y aduanera</span>
                  <span {...langProps('es')}>Identificación fiscal y aduanera</span>
                </div>

                <div className="field">
                  <label>
                    <span {...langProps('en')}>NIF / CIF (Spanish tax ID) <span className="req">*</span></span>
                    <span {...langProps('es')}>NIF / CIF <span className="req">*</span></span>
                  </label>
                  <input type="text" name="nif" placeholder="e.g. B12345678 / B12345678" required />
                  <span className="hint" {...langProps('en')}>9 characters. Required for any business invoice in Spain.</span>
                  <span className="hint" {...langProps('es')}>9 caracteres. Necesario para cualquier factura empresarial en España.</span>
                </div>

                <div className="field">
                  <label>
                    <span {...langProps('en')}>VAT / VIES number (if registered)</span>
                    <span {...langProps('es')}>NIF-IVA / VIES (si estás registrado)</span>
                  </label>
                  <input type="text" name="vat_vies" placeholder="ESB12345678" />
                  <span className="hint" {...langProps('en')}>Your intra-community VAT number, format ES + NIF. Required for VAT-exempt cross-border invoicing.</span>
                  <span className="hint" {...langProps('es')}>Tu NIF-IVA intracomunitario, formato ES + NIF. Necesario para facturación intracomunitaria sin IVA.</span>
                </div>

                <div className="field">
                  <label>
                    <span {...langProps('en')}>EORI number</span>
                    <span {...langProps('es')}>Número EORI</span>
                  </label>
                  <input type="text" name="eori" placeholder="ES + NIF" />
                  <span className="hint" {...langProps('en')}>Required to clear goods through Spanish customs from outside the EU. If you don&apos;t have one, see the import-handling question below.</span>
                  <span className="hint" {...langProps('es')}>Necesario para despachar mercancía en aduana desde fuera de la UE. Si no tienes uno, consulta la pregunta sobre importación más abajo.</span>
                </div>

                <div className="field">
                  <label>
                    <span {...langProps('en')}>How will the goods be imported? <span className="req">*</span></span>
                    <span {...langProps('es')}>¿Cómo se importará la mercancía? <span className="req">*</span></span>
                  </label>
                  <select name="import_handling" required defaultValue="">
                    <option value="">—</option>
                    <option {...langProps('en')}>We have our own EORI and will handle import directly</option>
                    <option {...langProps('es')}>Tenemos EORI propio y gestionaremos la importación directamente</option>
                    <option {...langProps('en')}>We work with a customs broker / freight forwarder</option>
                    <option {...langProps('es')}>Trabajamos con un agente de aduanas / transitario</option>
                    <option {...langProps('en')}>We need Kiwi Pop&apos;s EU partner to handle import</option>
                    <option {...langProps('es')}>Necesitamos que el socio europeo de Kiwi Pop gestione la importación</option>
                    <option {...langProps('en')}>Not sure yet — we&apos;d like advice</option>
                    <option {...langProps('es')}>Aún no estamos seguros — buscamos asesoramiento</option>
                  </select>
                  <span className="hint" {...langProps('en')}>If you&apos;d rather Kiwi Pop&apos;s EU partner handle customs, that&apos;s available. The wholesale price will reflect that service.</span>
                  <span className="hint" {...langProps('es')}>Si prefieres que el socio europeo de Kiwi Pop se encargue de la aduana, es una opción disponible. El precio mayorista lo reflejará.</span>
                </div>

                {/* CONTACT */}
                <div className="modal-section-head">
                  <span {...langProps('en')}>Primary contact / Persona de contacto</span>
                  <span {...langProps('es')}>Persona de contacto</span>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>
                      <span {...langProps('en')}>Full name <span className="req">*</span></span>
                      <span {...langProps('es')}>Nombre completo <span className="req">*</span></span>
                    </label>
                    <input type="text" name="contact_name" required />
                  </div>
                  <div className="field">
                    <label>
                      <span {...langProps('en')}>Role / position <span className="req">*</span></span>
                      <span {...langProps('es')}>Cargo <span className="req">*</span></span>
                    </label>
                    <input type="text" name="contact_role" placeholder="Owner, Buyer, F&B Manager..." required />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>
                      <span {...langProps('en')}>Email <span className="req">*</span></span>
                      <span {...langProps('es')}>Correo electrónico <span className="req">*</span></span>
                    </label>
                    <input type="email" name="email" required />
                  </div>
                  <div className="field">
                    <label>
                      <span {...langProps('en')}>Phone / WhatsApp <span className="req">*</span></span>
                      <span {...langProps('es')}>Teléfono / WhatsApp <span className="req">*</span></span>
                    </label>
                    <input type="tel" name="phone" placeholder="+34 ..." required />
                  </div>
                </div>

                {/* OPERATIONAL */}
                <div className="modal-section-head">
                  <span {...langProps('en')}>Your floor / Vuestra sala</span>
                  <span {...langProps('es')}>Vuestra sala</span>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>
                      <span {...langProps('en')}>Average weekly capacity</span>
                      <span {...langProps('es')}>Aforo medio semanal</span>
                    </label>
                    <input type="text" name="capacity" placeholder="e.g. 800 / week" />
                  </div>
                  <div className="field">
                    <label>
                      <span {...langProps('en')}>Estimated initial order</span>
                      <span {...langProps('es')}>Pedido inicial estimado</span>
                    </label>
                    <select name="initial_order" defaultValue="">
                      <option value="">—</option>
                      <option {...langProps('en')}>Sample case only (~40 units)</option>
                      <option {...langProps('es')}>Solo caja de muestra (~40 uds.)</option>
                      <option>200 - 500</option>
                      <option>500 - 1,000</option>
                      <option>1,000 - 5,000</option>
                      <option {...langProps('en')}>5,000+</option>
                      <option {...langProps('es')}>Más de 5,000</option>
                      <option {...langProps('en')}>Not sure yet</option>
                      <option {...langProps('es')}>Aún no lo sé</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>
                    <span {...langProps('en')}>Tell us a bit about your floor</span>
                    <span {...langProps('es')}>Cuéntanos un poco sobre vuestra sala</span>
                  </label>
                  <textarea name="floor_notes" rows={4} />
                  <span className="hint" {...langProps('en')}>Music, crowd, hours, what currently sells well behind the bar, anything you&apos;d want us to know before we propose terms.</span>
                  <span className="hint" {...langProps('es')}>Música, público, horario, lo que se vende bien actualmente en la barra, lo que quieras que sepamos antes de proponerte condiciones.</span>
                </div>

                <div className="field">
                  <label>
                    <span {...langProps('en')}>Existing distributor relationships (if any)</span>
                    <span {...langProps('es')}>Relaciones existentes con distribuidores (si las hay)</span>
                  </label>
                  <input type="text" name="distributors" />
                  <span className="hint" {...langProps('en')}>Optional. Helps us understand if there&apos;s an existing supply chain we should plug into.</span>
                  <span className="hint" {...langProps('es')}>Opcional. Nos ayuda a entender si ya hay una cadena de suministro a la que podamos sumarnos.</span>
                </div>

                {/* CONSENTS */}
                <div className="modal-section-head">
                  <span {...langProps('en')}>Confirmations / Confirmaciones</span>
                  <span {...langProps('es')}>Confirmaciones</span>
                </div>

                <div className="checkbox-field">
                  <input type="checkbox" id="age_check" name="age_check" required />
                  <label htmlFor="age_check">
                    <span {...langProps('en')}>Our venue serves customers 18 and over and is licensed to sell food and beverages in Spain.</span>
                    <span {...langProps('es')}>Nuestra sala atiende a personas mayores de 18 años y dispone de licencia para la venta de alimentos y bebidas en España.</span>
                  </label>
                </div>

                <div className="checkbox-field">
                  <input type="checkbox" id="data_check" name="data_check" required />
                  <label htmlFor="data_check">
                    <span {...langProps('en')}>I consent to Kiwi Pop processing the information above for the purpose of evaluating this wholesale application, in accordance with EU GDPR.</span>
                    <span {...langProps('es')}>Doy mi consentimiento para que Kiwi Pop trate la información anterior con el fin de evaluar esta solicitud de mayorista, de acuerdo con el RGPD de la UE.</span>
                  </label>
                </div>

                <button type="submit" className="submit-btn">
                  <span {...langProps('en')}>Submit application</span>
                  <span {...langProps('es')}>Enviar solicitud</span>
                </button>

                <p className="form-note">
                  <span {...langProps('en')}>We respond within 48 hours, typically with a sample-case offer and a short call to talk through fit. Information is shared only with Kiwi Pop&apos;s wholesale team and is never sold or shared with third parties.</span>
                  <span {...langProps('es')}>Respondemos en un plazo de 48 horas, normalmente con una oferta de caja de muestra y una llamada breve para hablar del encaje. La información se comparte únicamente con el equipo mayorista de Kiwi Pop y nunca se vende ni se cede a terceros.</span>
                </p>
              </form>
            </div>
          ) : (
            <div className="modal-success active">
              <div className="check">舐</div>
              <h3 {...langProps('en')}>Application received.</h3>
              <h3 {...langProps('es')}>Solicitud recibida.</h3>
              <p {...langProps('en')}>Thank you. We&apos;ll be in touch within 48 hours from <strong>thekiwipop@gmail.com</strong>. Kiwi may also reach out by WhatsApp.</p>
              <p {...langProps('es')}>Gracias. Nos pondremos en contacto en un plazo de 48 horas desde <strong>thekiwipop@gmail.com</strong>. Es posible que Kiwi también te escriba por WhatsApp.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PortfolioImage {
  src: string;
  alt: string;
  caption: string;
}

// Placeholder shots — using existing flavor / lifestyle imagery from the
// landing page until proper EU product photography is available.
const PORTFOLIO_IMAGES: PortfolioImage[] = [
  {
    src: '/landing/img/kiwi-kitty-pop.webp',
    alt: 'Kiwi Pop · Kiwi Kitty flavor',
    caption: 'KIWI KITTY · 舐',
  },
  {
    src: '/landing/img/yellow-hair.jpg',
    alt: 'Kiwi Pop · Lucy Lemon flavor',
    caption: 'LUCY LEMON',
  },
  {
    src: '/landing/img/lips-lollipop.jpg',
    alt: 'Kiwi Pop · Mango Molly flavor',
    caption: 'MANGO MOLLY',
  },
  {
    src: '/landing/img/eye-galaxy.jpg',
    alt: 'Kiwi Pop · Mary Mint flavor',
    caption: 'MARY MINT',
  },
];

type SpecStatus = 'confirmed' | 'estimate' | 'tbd';

interface SpecRow {
  labelEn: string;
  labelEs: string;
  valueEn: string;
  valueEs: string;
  status: SpecStatus;
}

interface SpecGroup {
  headingEn: string;
  headingEs: string;
  rows: SpecRow[];
}

const STATUS_LABELS: Record<Lang, Record<SpecStatus, string>> = {
  en: { confirmed: 'CONFIRMED', estimate: 'ESTIMATE', tbd: 'TBD' },
  es: { confirmed: 'CONFIRMADO', estimate: 'ESTIMACIÓN', tbd: 'POR DETERMINAR' },
};

const SPEC_GROUPS: SpecGroup[] = [
  {
    headingEn: 'Product identity',
    headingEs: 'Identidad del producto',
    rows: [
      {
        labelEn: 'Product name',
        labelEs: 'Nombre del producto',
        valueEn: 'Kiwi Pop · Drop 001 EU',
        valueEs: 'Kiwi Pop · Drop 001 EU',
        status: 'confirmed',
      },
      {
        labelEn: 'Product type',
        labelEs: 'Tipo de producto',
        valueEn: 'Functional hard candy lollipop',
        valueEs: 'Piruleta funcional dura',
        status: 'confirmed',
      },
      {
        labelEn: 'Net weight per unit',
        labelEs: 'Peso neto por unidad',
        valueEn: '~10g',
        valueEs: '~10g',
        status: 'estimate',
      },
      {
        labelEn: 'Country of manufacture',
        labelEs: 'País de fabricación',
        valueEn: 'TBD (US or EU co-packer)',
        valueEs: 'Por determinar (envasador US o UE)',
        status: 'tbd',
      },
      {
        labelEn: 'EAN / barcode',
        labelEs: 'EAN / código de barras',
        valueEn: 'TBD',
        valueEs: 'Por determinar',
        status: 'tbd',
      },
      {
        labelEn: 'Customs HS code',
        labelEs: 'Código arancelario',
        valueEn: '1704.90 (sugar confectionery, no cocoa)',
        valueEs: '1704.90 (productos de confitería, sin cacao)',
        status: 'estimate',
      },
    ],
  },
  {
    headingEn: 'Ingredients',
    headingEs: 'Ingredientes',
    rows: [
      {
        labelEn: 'Full ingredient list (descending by weight, EU format)',
        labelEs: 'Lista completa de ingredientes (orden decreciente por peso, formato UE)',
        valueEn:
          'Isomalt, xylitol, natural flavors, glycerin, citric acid, magnesium glycinate, taurine, theobromine, electrolyte blend (sodium, potassium), L-ascorbic acid, ginseng extract, blue spirulina, jambu (Acmella oleracea) extract, methylcobalamin (B12), edible mica (E555). Final order and inclusion subject to EU regulatory review.',
        valueEs:
          'Isomalt, xilitol, aromas naturales, glicerina, ácido cítrico, glicinato de magnesio, taurina, teobromina, mezcla de electrolitos (sodio, potasio), ácido L-ascórbico, extracto de ginseng, espirulina azul, extracto de jambú (Acmella oleracea), metilcobalamina (B12), mica comestible (E555). Orden e inclusión finales sujetos a revisión regulatoria UE.',
        status: 'estimate',
      },
      {
        labelEn: 'Allergens',
        labelEs: 'Alérgenos',
        valueEn: 'None of the 14 EU-declarable allergens',
        valueEs: 'Ninguno de los 14 alérgenos de declaración obligatoria en la UE',
        status: 'estimate',
      },
      {
        labelEn: 'Dietary suitability',
        labelEs: 'Idoneidad',
        valueEn: 'Vegan, gluten-free, no added sugar, kosher pending',
        valueEs: 'Vegana, sin gluten, sin azúcar añadido, kosher pendiente',
        status: 'estimate',
      },
    ],
  },
  {
    headingEn: 'Nutrition (per 100g, EU format)',
    headingEs: 'Nutrición (por 100g, formato UE)',
    rows: [
      {
        labelEn: 'Energy',
        labelEs: 'Energía',
        valueEn: '~350 kcal / 1465 kJ',
        valueEs: '~350 kcal / 1465 kJ',
        status: 'estimate',
      },
      {
        labelEn: 'Fat',
        labelEs: 'Grasas',
        valueEn: '<0.5g',
        valueEs: '<0,5g',
        status: 'estimate',
      },
      {
        labelEn: 'of which saturates',
        labelEs: 'de las cuales saturadas',
        valueEn: '<0.1g',
        valueEs: '<0,1g',
        status: 'estimate',
      },
      {
        labelEn: 'Carbohydrates',
        labelEs: 'Hidratos de carbono',
        valueEn: '~95g',
        valueEs: '~95g',
        status: 'estimate',
      },
      {
        labelEn: 'of which sugars',
        labelEs: 'de los cuales azúcares',
        valueEn: '<5g',
        valueEs: '<5g',
        status: 'estimate',
      },
      {
        labelEn: 'of which polyols',
        labelEs: 'de los cuales polialcoholes',
        valueEn: '~80g',
        valueEs: '~80g',
        status: 'estimate',
      },
      {
        labelEn: 'Protein',
        labelEs: 'Proteínas',
        valueEn: '<0.5g',
        valueEs: '<0,5g',
        status: 'estimate',
      },
      {
        labelEn: 'Salt',
        labelEs: 'Sal',
        valueEn: '~0.3g',
        valueEs: '~0,3g',
        status: 'estimate',
      },
    ],
  },
  {
    headingEn: 'Packaging',
    headingEs: 'Embalaje',
    rows: [
      {
        labelEn: 'Primary packaging',
        labelEs: 'Envase primario',
        valueEn: 'Individually wrapped, food-grade BOPP film with twisted ends',
        valueEs: 'Envasado individual en film BOPP de calidad alimentaria',
        status: 'estimate',
      },
      {
        labelEn: 'Wrapper printing',
        labelEs: 'Impresión',
        valueEn: 'Full-color, 4-color process, EU-compliant labeling in Spanish and English',
        valueEs: 'Cuatricromía a todo color, etiquetado conforme a la UE en español e inglés',
        status: 'estimate',
      },
      {
        labelEn: 'Inner case',
        labelEs: 'Caja interior',
        valueEn: 'TBD units per inner',
        valueEs: 'Por determinar unidades por caja interior',
        status: 'tbd',
      },
      {
        labelEn: 'Master case',
        labelEs: 'Caja máster',
        valueEn: 'TBD units per master',
        valueEs: 'Por determinar unidades por caja máster',
        status: 'tbd',
      },
      {
        labelEn: 'Pallet config',
        labelEs: 'Configuración de palet',
        valueEn: 'TBD',
        valueEs: 'Por determinar',
        status: 'tbd',
      },
    ],
  },
  {
    headingEn: 'Shelf life & storage',
    headingEs: 'Caducidad y conservación',
    rows: [
      {
        labelEn: 'Shelf life',
        labelEs: 'Vida útil',
        valueEn: '12-18 months from production',
        valueEs: '12-18 meses desde producción',
        status: 'estimate',
      },
      {
        labelEn: 'Storage',
        labelEs: 'Conservación',
        valueEn: 'Cool, dry, away from direct sunlight. Below 25°C',
        valueEs: 'Lugar fresco y seco, alejado de la luz solar directa. Por debajo de 25°C',
        status: 'confirmed',
      },
      {
        labelEn: 'Refrigeration required',
        labelEs: 'Refrigeración necesaria',
        valueEn: 'No',
        valueEs: 'No',
        status: 'confirmed',
      },
    ],
  },
  {
    headingEn: 'Regulatory',
    headingEs: 'Normativa',
    rows: [
      {
        labelEn: 'EU Regulation 1169/2011 (food information)',
        labelEs: 'Reglamento UE 1169/2011 (información alimentaria)',
        valueEn: 'Compliant',
        valueEs: 'Cumple',
        status: 'estimate',
      },
      {
        labelEn: 'AESAN (Spanish food safety authority)',
        labelEs: 'AESAN (Agencia Española de Seguridad Alimentaria)',
        valueEn: 'Documentation in progress',
        valueEs: 'Documentación en proceso',
        status: 'tbd',
      },
      {
        labelEn: 'EU Novel Food status',
        labelEs: 'Estado en el Catálogo de Nuevos Alimentos UE',
        valueEn:
          'All ingredients to be confirmed against EU Novel Food Catalogue',
        valueEs:
          'Todos los ingredientes pendientes de confirmar en el Catálogo de Nuevos Alimentos UE',
        status: 'estimate',
      },
      {
        labelEn: 'Country of origin labeling',
        labelEs: 'Etiquetado de origen',
        valueEn: 'To be confirmed once co-packer is locked',
        valueEs: 'Por confirmar cuando se cierre el envasador',
        status: 'tbd',
      },
    ],
  },
];

interface FaqEntry {
  qEn: string;
  qEs: string;
  aEn: string;
  aEs: string;
}

const FAQS: FaqEntry[] = [
  {
    qEn: 'What is jambu, and is it safe?',
    qEs: '¿Qué es el jambú y es seguro?',
    aEn: 'Jambu (also called paracress, or by its scientific name Acmella oleracea) is a flowering plant from South America. Its extract is what creates the small mouth tingle and slight numbing sensation, similar to what you feel from Sichuan peppercorns or sherbet powder. It’s used as a flavor in chewing gum, oral-care products, and certain foods. The European Food Safety Authority (EFSA) has reviewed the active compound, spilanthol, and established a safe daily intake. The amount in one Kiwi Pop is well below that level, in the range used as a standard food flavoring rather than a supplement dose. It’s not psychoactive and doesn’t interact with alcohol.',
    aEs: 'El jambú (también llamado paracress, o por su nombre científico Acmella oleracea) es una planta con flor originaria de América del Sur. Su extracto es lo que produce ese pequeño cosquilleo y leve adormecimiento en la boca, parecido a lo que se siente con la pimienta de Sichuan o el polvo efervescente. Se utiliza como aromatizante en chicles, productos de higiene bucal y ciertos alimentos. La Autoridad Europea de Seguridad Alimentaria (EFSA) ha revisado el compuesto activo, el espilantol, y ha establecido una ingesta diaria segura. La cantidad en una Kiwi Pop está muy por debajo de ese nivel, en el rango habitual de un aromatizante alimentario, no de una dosis de suplemento. No es psicoactivo y no interactúa con el alcohol.',
  },
  {
    qEn: 'How does it taste? Will my customers actually like it?',
    qEs: '¿A qué sabe? ¿Le gustará a mis clientes?',
    aEn: 'The base flavor is fruit-forward and bright. Kiwi (sweet and tart) is the lead, with lemon-ginger, mango, and peppermint flavors planned. The jambu tingle is light, not aggressive, and arrives a few seconds after the first lick. Most people read it as a fun surprise rather than a strong sensation. The xylitol base sweetens like sugar but is tooth-friendly and won’t spike blood sugar. We always send a sample case before any commitment so your team can taste it and your floor can react before you decide.',
    aEs: 'El sabor base es afrutado y brillante. El kiwi (dulce y ácido) es el principal, con sabores de limón-jengibre, mango y menta también previstos. El cosquilleo del jambú es ligero, no agresivo, y aparece a los pocos segundos del primer chupetón. La mayoría de la gente lo percibe como una sorpresa divertida más que como una sensación fuerte. La base de xilitol endulza como el azúcar pero es respetuosa con los dientes y no eleva la glucosa en sangre. Siempre enviamos una caja de muestra antes de cualquier compromiso, para que tu equipo lo pruebe y veas cómo reacciona la sala antes de decidir.',
  },
  {
    qEn: 'How is this different from an energy drink or a functional shot?',
    qEs: '¿En qué se diferencia esto de una bebida energética o un shot funcional?',
    aEn: 'No caffeine. The lift comes from theobromine (a milder, longer cousin of caffeine, the same compound that makes dark chocolate feel pleasant), B12, and ginseng, with magnesium and electrolytes balancing it out. The point isn’t to spike someone up; it’s to keep them comfortable through a long night. It also takes the form of a lollipop, not a can or a shot, so it sits in a different mental category for the customer: a small treat, not a stimulant purchase.',
    aEs: 'Sin cafeína. El empuje viene de la teobromina (un primo más suave y duradero de la cafeína, el mismo compuesto que hace que el chocolate negro siente bien), la B12 y el ginseng, equilibrados con magnesio y electrolitos. La idea no es subir a nadie de golpe, sino mantenerle cómodo durante una noche larga. Además, tiene forma de piruleta, no de lata ni de chupito, así que para el cliente entra en una categoría mental distinta: un pequeño capricho, no la compra de un estimulante.',
  },
  {
    qEn: 'What’s the shelf life and storage?',
    qEs: '¿Cuál es la caducidad y cómo se conserva?',
    aEn: 'Hard candy on an isomalt base is shelf-stable for around 12-18 months in standard conditions. No refrigeration needed. Keep cool and dry, away from direct sunlight. Each pop is individually wrapped, so handling at the bar or counter is straightforward. Final shelf life will be confirmed on the EU spec sheet alongside the finalized formula.',
    aEs: 'Los caramelos duros con base de isomalt son estables a temperatura ambiente entre 12 y 18 meses en condiciones normales. No requieren frío. Conservar en lugar fresco y seco, alejado de la luz solar directa. Cada piruleta va envasada individualmente, así que la manipulación en barra o mostrador es sencilla. La caducidad definitiva se confirmará en la ficha técnica europea junto con la fórmula final.',
  },
  {
    qEn: 'What about allergens and dietary restrictions?',
    qEs: '¿Y los alérgenos y restricciones alimentarias?',
    aEn: 'Vegan. Gluten-free. No common allergens (no nuts, dairy, eggs, soy, or wheat) in the current formula. The xylitol base means it’s diabetic-friendly and doesn’t spike insulin. One real warning to flag with your customers: <strong>xylitol is highly toxic to dogs</strong>, so if a customer has a dog at the venue, the wrapper needs to stay out of reach. The full EU-compliant allergen panel will appear on the final wrapper in Spanish and English.',
    aEs: 'Vegana. Sin gluten. Sin alérgenos comunes (sin frutos secos, lácteos, huevo, soja ni trigo) en la fórmula actual. La base de xilitol la hace apta para diabéticos y no eleva la insulina. Un aviso real que conviene comunicar a los clientes: <strong>el xilitol es muy tóxico para los perros</strong>, así que si un cliente lleva su perro a la sala, el envoltorio debe quedar fuera de su alcance. El panel completo de alérgenos conforme a la normativa de la UE aparecerá en el envoltorio final en español e inglés.',
  },
  {
    qEn: 'Will you provide marketing materials in Spanish?',
    qEs: '¿Vais a aportar materiales de marketing en español?',
    aEn: 'Yes. Founding partners receive counter cards, social-media assets, and short-format video clips in Spanish for use on your channels. Wrapper text on the EU run will be in Spanish and English. If you have a particular format you find works well on your floor (table cards, drink-menu inserts, etc.), tell us and we’ll match it.',
    aEs: 'Sí. Los socios fundadores reciben tarjetas de mostrador, materiales para redes sociales y clips de vídeo de formato corto en español para usar en vuestros canales. El texto del envoltorio de la versión europea irá en español e inglés. Si tenéis algún formato concreto que os funciona en vuestra sala (carteles de mesa, insertos en la carta, etc.), decídnoslo y lo adaptamos.',
  },
  {
    qEn: 'What if it doesn’t sell? Can I return unsold stock?',
    qEs: '¿Y si no se vende? ¿Puedo devolver lo que no se haya vendido?',
    aEn: 'For founding partners on the first order, yes: any unsold, undamaged stock can be returned within 60 days for credit toward a future order, or refunded if you’d rather. We’re more interested in finding out whether the product fits your floor than in protecting margin on a first batch. After the first order, return terms shift to standard food-and-beverage industry practice (typically no returns on opened cases, credit on damaged-in-transit only).',
    aEs: 'Para los socios fundadores en el primer pedido, sí: cualquier stock no vendido y en buen estado se puede devolver en un plazo de 60 días, ya sea como crédito para un pedido futuro o como reembolso, lo que prefiráis. Nos interesa más averiguar si el producto encaja en vuestra sala que proteger el margen del primer lote. A partir del segundo pedido, las condiciones de devolución pasan a las habituales del sector de alimentación (normalmente no se aceptan devoluciones de cajas abiertas, solo crédito por daños en el transporte).',
  },
  {
    qEn: 'Can we have territorial exclusivity in our neighborhood?',
    qEs: '¿Podemos tener exclusividad territorial en nuestra zona?',
    aEn: 'Limited exclusivity is on the table for founding partners, on a case-by-case basis. We’re not promising it as default because we want to keep the door open to new venues that fit, but if exclusivity matters for your business model, raise it in the conversation and we’ll talk through what would work for both sides.',
    aEs: 'La exclusividad limitada está sobre la mesa para los socios fundadores, evaluada caso por caso. No la prometemos por defecto porque queremos dejar la puerta abierta a nuevas salas que encajen, pero si la exclusividad es importante para vuestro modelo de negocio, planteadla en la conversación y veremos juntos qué funciona para ambas partes.',
  },
  {
    qEn: 'What about Spanish regulatory and labeling compliance?',
    qEs: '¿Qué hay sobre el cumplimiento normativo y el etiquetado en España?',
    aEn: 'The EU version will be compliant with EU food regulations (Regulation 1169/2011 on food information to consumers), with full Spanish-language labeling, mandatory nutrition declaration, allergen highlighting, and proper E-number disclosure. We’re working with a regulatory consultancy to confirm the formula and packaging meet Spanish AESAN requirements before any wholesale ship date. We’ll share the regulatory documentation pack with founding partners ahead of the first delivery so your team can confirm it fits your house standards.',
    aEs: 'La versión europea cumplirá la normativa alimentaria de la UE (Reglamento 1169/2011 sobre información alimentaria al consumidor), con etiquetado completo en español, declaración nutricional obligatoria, alérgenos resaltados y números E correctamente declarados. Estamos trabajando con una consultoría regulatoria para confirmar que la fórmula y el envase cumplen los requisitos de AESAN antes de cualquier fecha de envío al por mayor. Compartiremos la documentación regulatoria con los socios fundadores antes de la primera entrega para que vuestro equipo pueda confirmar que cumple vuestros estándares.',
  },
];
