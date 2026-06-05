import { animate, createScope, stagger } from 'animejs'
import { useEffect, useRef } from 'react'
import './landingpages.css'

const features = [
  {
    icon: '⚡',
    title: 'Respon Cepat',
    desc: 'Kuromi AI memberikan jawaban instan untuk pertanyaan apa pun, kapan pun.',
  },
  {
    icon: '🧠',
    title: 'Pintar & Kontekstual',
    desc: 'Memahami konteks percakapanmu dan memberikan solusi yang relevan.',
  },
  {
    icon: '🔒',
    title: 'Privasi Terjaga',
    desc: 'Semua percakapan dienkripsi dan tersimpan aman di workspace pribadimu.',
  },
  {
    icon: '📱',
    title: 'Akses Mobile',
    desc: 'Nikmati Kuromi AI di laptop maupun mobile, kapan saja dan di mana saja.',
  },
]

function LandingPages() {
  const rootRef = useRef(null)

  useEffect(() => {
    if (!rootRef.current) return

    const scope = createScope({
      root: rootRef.current,
      defaults: { ease: 'out(4)' },
      mediaQueries: {
        reduceMotion: '(prefers-reduced-motion: reduce)',
        compact: '(max-width: 960px)',
      },
    }).add((self) => {
      const { reduceMotion, compact } = self.matches

      animate('[data-reveal]', {
        opacity: [{ from: 0, to: 1 }],
        translateY: reduceMotion ? 0 : ['2rem', 0],
        scale: reduceMotion ? 1 : [0.97, 1],
        delay: stagger(100, { start: compact ? 0 : 100 }),
        duration: reduceMotion ? 0 : 820,
      })

      if (!reduceMotion) {
        animate('.landing-orb', {
          translateY: ['0rem', '-1.2rem'],
          scale: [1, 1.1],
          delay: stagger(250, { from: 'center' }),
          duration: 2800,
          loop: true,
          alternate: true,
          ease: 'inOut(3)',
        })

        animate('.feature-card', {
          translateY: ['0rem', '-0.3rem'],
          delay: stagger(120),
          duration: 2000,
          loop: true,
          alternate: true,
          ease: 'inOut(2)',
        })

        animate('.cta-button', {
          boxShadow: [
            '0 16px 30px rgba(48, 32, 37, 0.18)',
            '0 22px 40px rgba(48, 32, 37, 0.28)',
          ],
          scale: [1, 1.02],
          duration: 1800,
          loop: true,
          alternate: true,
          ease: 'inOut(2)',
        })
      }
    })

    return () => scope.revert()
  }, [])

  return (
    <main ref={rootRef} className="landing-page">
      <div className="landing-orbs" aria-hidden="true">
        <span className="landing-orb orb-a"></span>
        <span className="landing-orb orb-b"></span>
        <span className="landing-orb orb-c"></span>
      </div>

      <section className="hero">
        <p className="hero-eyebrow" data-reveal>
          Kuromi AI
        </p>
        <h1 data-reveal>
          Asisten AI Pintar
          <br />
          <span className="hero-highlight">untuk Setiap Ide</span>
        </h1>
        <p className="hero-desc" data-reveal>
          Kuromi AI membantu kamu brainstorming, merapikan ide, dan menemukan
          jawaban lebih cepat. Mulai ngobrol sekarang dan rasakan perbedaannya.
        </p>
        <div className="hero-actions" data-reveal>
          <button className="cta-button primary">Mulai Sekarang</button>
          <button className="cta-button secondary">Pelajari Lebih Lanjut</button>
        </div>
      </section>

      <section className="features-section">
        <div className="features-header" data-reveal>
          <span className="features-badge">Fitur Unggulan</span>
          <h2>Mengapa Kuromi AI?</h2>
        </div>
        <div className="features-grid">
          {features.map((f) => (
            <article key={f.title} className="feature-card" data-reveal>
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section" data-reveal>
        <div className="cta-card">
          <h2>Siap Meningkatkan Produktivitas?</h2>
          <p>
            Bergabunglah dengan ribuan pengguna yang sudah merasakan kemudahan
            bekerja dengan Kuromi AI.
          </p>
          <button className="cta-button primary large">Mulai Gratis</button>
        </div>
      </section>

      <footer className="landing-footer" data-reveal>
        <p>&copy; 2026 Kuromi AI. All rights reserved.</p>
      </footer>
    </main>
  )
}

export default LandingPages
