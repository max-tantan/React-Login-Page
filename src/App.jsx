import { animate, createScope, stagger } from 'animejs'
import { useEffect, useRef, useState } from 'react'
import ChatBox from './components/ChatBox.jsx'
import './App.css'

const highlights = [
  'Masuk dan lanjutkan percakapan AI yang terakhir',
  'Gunakan copilot untuk ide, ringkasan, dan drafting cepat',
  'Akses workspace chat dari laptop maupun mobile',
]

const typingHeadline = 'Masuk untuk mulai ngobrol dengan AI copilot timmu.'

function App() {
  const rootRef = useRef(null)
  const loginTimerRef = useRef(null)
  const [showPassword, setShowPassword] = useState(false)
  const [headlineText, setHeadlineText] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState('demo@aichat.app')
  const [password, setPassword] = useState('password123')

  useEffect(() => {
    let frame = 0

    const intervalId = window.setInterval(() => {
      frame += 1
      setHeadlineText(typingHeadline.slice(0, frame))

      if (frame >= typingHeadline.length) {
        window.clearInterval(intervalId)
      }
    }, 42)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!rootRef.current || isLoggedIn) return undefined

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
  }, [isLoggedIn])

  useEffect(() => {
    return () => {
      if (loginTimerRef.current) {
        window.clearTimeout(loginTimerRef.current)
      }
    }
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (isAuthenticating) return

    setIsAuthenticating(true)

    loginTimerRef.current = window.setTimeout(() => {
      setIsLoggedIn(true)
      setIsAuthenticating(false)
    }, 1400)
  }

  if (isLoggedIn) {
    return <ChatBox accountEmail={email} />
  }

  return (
    <main ref={rootRef} className="login-page">
      <div className="login-orbs" aria-hidden="true">
        <span className="login-orb orb-one"></span>
        <span className="login-orb orb-two"></span>
        <span className="login-orb orb-three"></span>
      </div>

      <section className="login-showcase">
        <p className="eyebrow" data-reveal>
          AI chat access
        </p>
        <h1 data-reveal>
          {headlineText}
          <span className="typing-cursor" aria-hidden="true"></span>
        </h1>
        <p className="showcase-copy" data-reveal>
          Login ini dirancang sebagai pintu masuk ke workspace AI chat untuk
          brainstorming, merapikan ide, dan membalas pertanyaan lebih cepat.
        </p>

        <div className="showcase-card" data-reveal>
          <div className="showcase-metric">
            <span className="metric-value">Instant</span>
            <span className="metric-label">Masuk, tanya, dan lanjut kerja</span>
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
          <span className="brand-mark">AI</span>
          <div>
            <h2>Enter AI Chat</h2>
            <p>Masuk untuk membuka ruang percakapan dengan asisten AI kamu.</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="trust-row" data-reveal>
            <span className="trust-chip">Private session</span>
            <span className="trust-copy">Percakapanmu tersimpan aman di workspace</span>
          </div>

          <label className="field" data-reveal>
            <span>Email</span>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <small>Gunakan email akun yang ingin dipakai masuk ke AI chat.</small>
          </label>

          <label className="field" data-reveal>
            <span>Password</span>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            <small>Demo login ini akan langsung membuka halaman AI chat.</small>
          </label>

          <div className="form-row" data-reveal>
            <label className="remember-me">
              <input type="checkbox" defaultChecked />
              <span>Ingat sesi AI saya</span>
            </label>
            <a href="/" onClick={(event) => event.preventDefault()}>
              Butuh bantuan akses?
            </a>
          </div>

          <button type="submit" className="submit-button" data-reveal>
            {isAuthenticating ? 'Membuka AI chat...' : 'Masuk ke AI Chat'}
          </button>

          <div className="divider" data-reveal>
            <span>atau</span>
          </div>

          <button type="button" className="secondary-button" data-reveal>
            Lanjutkan dengan Google
          </button>
        </form>

        <p className="signup-copy" data-reveal>
          Belum punya akses workspace?{' '}
          <a href="/" onClick={(event) => event.preventDefault()}>
            Minta undangan
          </a>
        </p>
      </section>
    </main>
  )
}

export default App
