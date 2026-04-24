import { animate, createScope, stagger } from 'animejs'
import { useEffect, useRef, useState } from 'react'
import './App.css'

const highlights = [
  'Pantau aktivitas akun secara real-time',
  'Akses dashboard dari perangkat apa pun',
  'Keamanan login dengan verifikasi berlapis',
]

function App() {
  const rootRef = useRef(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!rootRef.current) return undefined

    const scope = createScope({
      root: rootRef.current,
      defaults: {
        ease: 'out(4)',
      },
      mediaQueries: {
        reduceMotion: '(prefers-reduced-motion: reduce)',
        compact: '(max-width: 960px)',
      },
    }).add((self) => {
      const { reduceMotion, compact } = self.matches

      animate('[data-reveal]', {
        opacity: [{ from: 0, to: 1 }],
        translateY: reduceMotion ? 0 : ['2rem', 0],
        scale: reduceMotion ? 1 : [0.98, 1],
        delay: stagger(90, { start: compact ? 0 : 120 }),
        duration: reduceMotion ? 0 : 820,
      })

      if (!reduceMotion) {
        animate('.login-orb', {
          translateY: ['0rem', '-1rem'],
          scale: [1, 1.08],
          delay: stagger(220, { from: 'center' }),
          duration: 2400,
          loop: true,
          alternate: true,
          ease: 'inOut(3)',
        })

        animate('.highlight-list li', {
          translateX: ['0rem', '0.35rem'],
          delay: stagger(180),
          duration: 1800,
          loop: true,
          alternate: true,
          ease: 'inOut(2)',
        })

        animate('.submit-button', {
          boxShadow: [
            '0 16px 30px rgba(48, 32, 37, 0.18)',
            '0 22px 40px rgba(48, 32, 37, 0.28)',
          ],
          scale: [1, 1.015],
          duration: 1600,
          loop: true,
          alternate: true,
          ease: 'inOut(2)',
        })
      }
    })

    return () => scope.revert()
  }, [])

  return (
    <main ref={rootRef} className="login-page">
      <div className="login-orbs" aria-hidden="true">
        <span className="login-orb orb-one"></span>
        <span className="login-orb orb-two"></span>
        <span className="login-orb orb-three"></span>
      </div>

      <section className="login-showcase">
        <p className="eyebrow" data-reveal>
          Welcome back
        </p>
        <h1 data-reveal>Masuk untuk melanjutkan pekerjaanmu tanpa hambatan.</h1>
        <p className="showcase-copy">
          Kelola proyek, pantau progres tim, dan simpan semua aktivitas penting
          dalam satu dashboard yang terasa cepat dan aman.
        </p>

        <div className="showcase-card" data-reveal>
          <div className="showcase-metric">
            <span className="metric-value">24/7</span>
            <span className="metric-label">Akses akun kapan saja</span>
          </div>
          <ul className="highlight-list">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="login-panel">
        <div className="panel-header" data-reveal>
          <span className="brand-mark">VR</span>
          <div>
            <h2>Sign in</h2>
            <p>Masukkan email dan password untuk mengakses akunmu.</p>
          </div>
        </div>

        <form className="login-form">
          <div className="trust-row" data-reveal>
            <span className="trust-chip">SSL secured</span>
            <span className="trust-copy">Login aman dan terenkripsi</span>
          </div>

          <label className="field" data-reveal>
            <span>Email</span>
            <input type="email" placeholder="nama@email.com" />
            <small>Gunakan email yang terdaftar di akun tim kamu.</small>
          </label>

          <label className="field" data-reveal>
            <span>Password</span>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            <small>Minimal 8 karakter untuk menjaga keamanan akun.</small>
          </label>

          <div className="form-row" data-reveal>
            <label className="remember-me">
              <input type="checkbox" />
              <span>Ingat saya</span>
            </label>
            <a href="/" onClick={(event) => event.preventDefault()}>
              Lupa password?
            </a>
          </div>

          <button type="submit" className="submit-button" data-reveal>
            Masuk
          </button>

          <div className="divider" data-reveal>
            <span>atau</span>
          </div>

          <button type="button" className="secondary-button" data-reveal>
            Masuk dengan Google
          </button>
        </form>

        <p className="signup-copy" data-reveal>
          Belum punya akun?{' '}
          <a href="/" onClick={(event) => event.preventDefault()}>
            Daftar sekarang
          </a>
        </p>
      </section>
    </main>
  )
}

export default App
