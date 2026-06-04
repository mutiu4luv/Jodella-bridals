import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/useAuth'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('submitting')
    setMessage('')

    try {
      const payload =
        mode === 'register'
          ? await api.auth.register({ name, email, password })
          : await api.auth.login({ email, password })

      signIn({ token: payload.token, user: payload.user })
      navigate(payload.user.role === 'admin' ? '/admin' : '/', { replace: true })
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Unable to continue.')
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,132,255,0.22),_transparent_32%),linear-gradient(180deg,_#fffafc_0%,_#f5efff_55%,_#ffffff_100%)] px-4 py-10 text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_90px_rgba(72,27,95,0.12)] backdrop-blur-xl">
          <div className="inline-flex rounded-full border border-[#e8d9ff] bg-[#f8f2ff] px-4 py-2 text-sm font-semibold text-[#6f2dbd]">
            Jodella Bridal Portal
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-[#1f132d] sm:text-5xl">
            Sign in to submit forms or manage every bridal booking from one modern dashboard.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Register as a user to fill the bridal form, or log in with an admin account to review
            all submissions, customer details, and paperwork in the dashboard.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ['Role aware', 'Users and admins see different screens.'],
              ['Secure API', 'JWT authentication protects submissions.'],
              ['Modern admin', 'Clean cards, tables, and detail views.'],
            ].map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-[#ecdfff] bg-white p-4">
                <p className="text-sm font-semibold text-[#6f2dbd]">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#ecdfff] bg-white/90 p-6 shadow-[0_20px_60px_rgba(72,27,95,0.08)] sm:p-8">
          <div className="flex rounded-full bg-[#f5efff] p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-full px-4 py-2 transition ${
                mode === 'login' ? 'bg-white text-[#6f2dbd] shadow-sm' : 'text-slate-500'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-full px-4 py-2 transition ${
                mode === 'register' ? 'bg-white text-[#6f2dbd] shadow-sm' : 'text-slate-500'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' ? (
              <Field label="Full name" value={name} onChange={setName} type="text" />
            ) : null}
            <Field label="Email address" value={email} onChange={setEmail} type="email" />
            <Field label="Password" value={password} onChange={setPassword} type="password" />

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full rounded-full bg-[#6f2dbd] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(111,45,189,0.28)] transition hover:bg-[#5c24a0] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'submitting'
                ? 'Please wait...'
                : mode === 'register'
                  ? 'Create account'
                  : 'Login'}
            </button>

            {message ? (
              <p
                className={`text-sm ${
                  status === 'error' ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {message}
              </p>
            ) : null}
          </form>

          <div className="mt-6 rounded-2xl border border-[#f0e6ff] bg-[#fbf8ff] p-4 text-sm leading-6 text-slate-600">
            Admin access is created from the backend environment values `ADMIN_EMAIL`,
            `ADMIN_PASSWORD`, and `ADMIN_NAME`.
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({
  label,
  value,
  onChange,
  type,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10"
      />
    </label>
  )
}
