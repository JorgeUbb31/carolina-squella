import { useState } from 'react'
import { AlertCircle, LoaderCircle, LogIn, ShieldCheck, Sparkles } from 'lucide-react'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onLogin(email, password)
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-brand"><span className="brand-mark">CS</span><span>CAROLINA SQUELLA</span></div>
        <div className="login-copy">
          <span className="eyebrow">OPERACIONES · INVENTARIO</span>
          <h1>Control claro.<br /><em>Stock al día.</em></h1>
          <p>Ingresa para administrar productos, disponibilidad y niveles de inventario.</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <p className="form-error"><AlertCircle size={16} />{error}</p>}
          <button className="button button-primary login-submit" type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={18} /> : <LogIn size={18} />}
            {busy ? 'Ingresando…' : 'Ingresar al inventario'}
          </button>
        </form>
        <div className="login-foot"><ShieldCheck size={16} /> Acceso protegido para administración</div>
      </section>
      <aside className="login-art" aria-label="Textiles de Carolina Squella">
        <div className="art-stamp"><Sparkles size={18} /><span>HECHO PARA DURAR</span></div>
        <div className="art-caption"><span>01 / COLECCIÓN HOGAR</span><strong>Texturas que<br />visten espacios.</strong></div>
      </aside>
    </main>
  )
}
