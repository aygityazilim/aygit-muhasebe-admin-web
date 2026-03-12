import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthAPI } from '../api'
import AygitLogo from '../components/AygitLogo'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await AuthAPI.login(email, password)
      localStorage.setItem('admin_token', res.data.data)
      navigate('/')
    } catch {
      setError('E-posta veya şifre hatalı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-surface-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <AygitLogo color="#6AD140" width={160} />
          </div>
          <p className="text-sm text-content-secondary mt-1">Admin Paneli</p>
        </div>

        <div className="bg-surface-primary rounded-2xl border border-border p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1.5">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-tertiary text-content-primary placeholder:text-content-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1.5">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-tertiary text-content-primary placeholder:text-content-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-status-error bg-status-error-bg rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-sm hover:bg-brand-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
