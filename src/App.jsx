import './App.css'

const highlights = [
  'Pantau aktivitas akun secara real-time',
  'Akses dashboard dari perangkat apa pun',
  'Keamanan login dengan verifikasi berlapis',
]

function App() {
  return (
    <main className="login-page">
      <section className="login-showcase">
        <p className="eyebrow">Welcome back</p>
        <h1>Masuk untuk melanjutkan pekerjaanmu tanpa hambatan.</h1>
        <p className="showcase-copy">
          Kelola proyek, pantau progres tim, dan simpan semua aktivitas penting
          dalam satu dashboard yang terasa cepat dan aman.
        </p>

        <div className="showcase-card">
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
        <div className="panel-header">
          <span className="brand-mark">VR</span>
          <div>
            <h2>Sign in</h2>
            <p>Masukkan email dan password untuk mengakses akunmu.</p>
          </div>
        </div>

        <form className="login-form">
          <label className="field">
            <span>Email</span>
            <input type="email" placeholder="nama@email.com" />
          </label>

          <label className="field">
            <span>Password</span>
            <input type="password" placeholder="Masukkan password" />
          </label>

          <div className="form-row">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Ingat saya</span>
            </label>
            <a href="/" onClick={(event) => event.preventDefault()}>
              Lupa password?
            </a>
          </div>

          <button type="submit" className="submit-button">
            Masuk
          </button>

          <button type="button" className="secondary-button">
            Masuk dengan Google
          </button>
        </form>

        <p className="signup-copy">
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
