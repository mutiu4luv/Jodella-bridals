import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { api } from '../lib/api'
import type { FormSubmission } from '../types'

export default function AdminDashboard() {
  const { user, token, signOut } = useAuth()
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!token) {
        return
      }

      try {
        setStatus('loading')
        const response = await api.forms.list(token)
        setSubmissions(response.data)
        setSelectedId((current) => current ?? response.data[0]?._id ?? null)
        setStatus('idle')
      } catch (error) {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Unable to load submissions.')
      }
    }

    load()
  }, [token])

  const stats = useMemo(() => {
    const total = submissions.length
    const latest = submissions[0]?.createdAt
    const uniqueBrides = new Set(submissions.map((submission) => submission.brideName)).size

    return [
      { label: 'Total submissions', value: String(total) },
      { label: 'Unique brides', value: String(uniqueBrides) },
      { label: 'Latest entry', value: latest ? new Date(latest).toLocaleString() : 'None yet' },
    ]
  }, [submissions])

  const selectedSubmission = submissions.find((submission) => submission._id === selectedId) ?? null

  const refresh = async () => {
    if (!token) {
      return
    }

    const response = await api.forms.list(token)
    setSubmissions(response.data)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,132,255,0.22),_transparent_32%),linear-gradient(180deg,_#fffafc_0%,_#f5efff_55%,_#ffffff_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_90px_rgba(72,27,95,0.12)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b5cf6]">
                Admin dashboard
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#1f132d]">Submission management</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Monitor every bridal form entry, review customer details, and drill into each
                submission without leaving the dashboard.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-[#ecdfff] bg-[#fbf8ff] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Signed in as</p>
                <p className="mt-1 text-sm font-semibold text-[#1f132d]">
                  {user?.name} {user?.role ? `• ${user.role}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  signOut()
                  navigate('/auth', { replace: true })
                }}
                className="rounded-full border border-[#e3d3ff] bg-white px-5 py-3 text-sm font-semibold text-[#6f2dbd] transition hover:bg-[#faf5ff]"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-[1.75rem] border border-[#ecdfff] bg-white/90 p-5 shadow-[0_20px_60px_rgba(72,27,95,0.08)]"
            >
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#1f132d]">{stat.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[2rem] border border-[#ecdfff] bg-white/90 p-6 shadow-[0_20px_60px_rgba(72,27,95,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b5cf6]">
                  Recent entries
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1f132d]">Bridal submissions</h2>
              </div>
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-full bg-[#f5efff] px-4 py-2 text-sm font-semibold text-[#6f2dbd] transition hover:bg-[#ebe2ff]"
              >
                Refresh
              </button>
            </div>

            {status === 'loading' ? (
              <p className="mt-6 text-sm text-slate-500">Loading submissions...</p>
            ) : null}

            {status === 'error' ? (
              <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {message}
              </p>
            ) : null}

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100">
              <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>Bride</span>
                <span>Wedding date</span>
                <span>Submitted by</span>
              </div>
              <div className="divide-y divide-slate-100">
                {submissions.map((submission) => {
                  const isActive = submission._id === selectedId

                  return (
                    <button
                      key={submission._id}
                      type="button"
                      onClick={() => setSelectedId(submission._id)}
                      className={`grid w-full grid-cols-[1.3fr_1fr_1fr] gap-3 px-4 py-4 text-left transition ${
                        isActive ? 'bg-[#faf5ff]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-semibold text-[#1f132d]">{submission.brideName}</span>
                      <span className="text-slate-600">{submission.weddingDate}</span>
                      <span className="text-slate-600">
                        {submission.submittedBy?.name || submission.submittedBy?.email || 'User'}
                      </span>
                    </button>
                  )
                })}

                {submissions.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-500">
                    No submissions yet.
                  </div>
                ) : null}
              </div>
            </div>
          </article>

          <aside className="rounded-[2rem] border border-[#ecdfff] bg-white/90 p-6 shadow-[0_20px_60px_rgba(72,27,95,0.08)]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b5cf6]">
                Submission detail
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#1f132d]">
                {selectedSubmission?.brideName || 'Select a submission'}
              </h2>
            </div>

            {selectedSubmission ? (
              <div className="mt-6 space-y-4">
                <DetailCard label="Bride phone" value={selectedSubmission.bridePhone} />
                <DetailCard label="Wedding date" value={selectedSubmission.weddingDate} />
                <DetailCard
                  label="Submitted by"
                  value={
                    selectedSubmission.submittedBy?.name
                      ? `${selectedSubmission.submittedBy.name} (${selectedSubmission.submittedBy.email})`
                      : 'Unknown user'
                  }
                />
                <DetailCard label="Home address" value={selectedSubmission.homeAddress || '—'} />
                <DetailCard label="Church" value={selectedSubmission.churchAddress || '—'} />
                <DetailCard label="Package" value={selectedSubmission.packageName || '—'} />
                <DetailCard
                  label="Package type"
                  value={selectedSubmission.weddingCardCopyType || '—'}
                />
                <DetailCard
                  label="Notes"
                  value={selectedSubmission.removedItems || 'No extra notes.'}
                  multiline
                />
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#d8c1ff] bg-[#fcf9ff] p-6 text-sm leading-6 text-slate-600">
                Pick a row on the left to inspect the submission in detail.
              </div>
            )}
          </aside>
        </section>
      </div>
    </main>
  )
}

function DetailCard({
  label,
  value,
  multiline = false,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[#f0e6ff] bg-[#fbf8ff] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-2 text-sm leading-6 text-[#1f132d] ${multiline ? 'whitespace-pre-line' : ''}`}>
        {value}
      </p>
    </div>
  )
}
