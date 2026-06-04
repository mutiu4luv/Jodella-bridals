import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { api } from '../lib/api'
import type { FormSubmission } from '../types'

type Metric = {
  label: string
  value: string
  note: string
}

type BarDatum = {
  label: string
  value: number
}

const detailFields: Array<{ label: string; key: keyof FormSubmission }> = [
  { label: 'Bride name', key: 'brideName' },
  { label: 'Bride phone', key: 'bridePhone' },
  { label: 'Home address', key: 'homeAddress' },
  { label: 'FB/IG address', key: 'socialAddress' },
  { label: 'Wedding date', key: 'weddingDate' },
  { label: 'Husband/Other relations name', key: 'husbandName' },
  { label: 'Husband/Other relations phone', key: 'husbandPhone' },
  { label: 'Husband/Other relations address', key: 'husbandAddress' },
  { label: 'State / City', key: 'stateCity' },
  { label: 'Church name & address', key: 'churchAddress' },
  { label: 'Wedding card copy type', key: 'weddingCardCopyType' },
  { label: 'Rental package chosen', key: 'packageName' },
  { label: 'Booking all items', key: 'packageAllItems' },
  { label: 'Package item A', key: 'packageItemA' },
  { label: 'Package item B', key: 'packageItemB' },
  { label: 'Package item C', key: 'packageItemC' },
  { label: 'Package item D', key: 'packageItemD' },
  { label: 'Package item E', key: 'packageItemE' },
  { label: 'Package item F', key: 'packageItemF' },
  { label: 'Removed items / notes', key: 'removedItems' },
  { label: 'Caution fee acknowledged', key: 'cautionFeeAcknowledged' },
  { label: 'Identification submitted', key: 'identificationSubmitted' },
  { label: 'Adjustment acknowledged', key: 'adjustmentAcknowledged' },
  { label: 'Return duration acknowledged', key: 'returnDurationAcknowledged' },
  { label: 'Pickup acknowledged', key: 'pickupAcknowledged' },
  { label: 'Fireworks acknowledged', key: 'fireworksAcknowledged' },
  { label: 'Cancellation acknowledged', key: 'cancellationAcknowledged' },
  { label: 'Damaged item acknowledged', key: 'damagedItemAcknowledged' },
  { label: 'Value acknowledged', key: 'valueAcknowledged' },
  { label: 'Materials returned', key: 'materialsReturned' },
  { label: 'Customer signature', key: 'customerSignature' },
  { label: 'Consultant signature', key: 'consultantSignature' },
  { label: 'M.D signature', key: 'mdSignature' },
  { label: 'Signature date', key: 'signatureDate' },
  { label: 'Submitted at', key: 'createdAt' },
]

export default function AdminDashboard() {
  const { user, token, signOut } = useAuth()
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<'dashboard' | 'returned'>('dashboard')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

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

  const metrics = useMemo<Metric[]>(() => {
    const total = submissions.length
    const returned = submissions.filter((submission) => submission.materialsReturned).length
    const pending = total - returned
    const latest = submissions[0]?.createdAt

    return [
      { label: 'Total submissions', value: String(total), note: 'All form entries received' },
      { label: 'Materials returned', value: String(returned), note: 'Marked as returned' },
      { label: 'Yet to return', value: String(pending), note: 'Still pending on the dashboard' },
      {
        label: 'Latest entry',
        value: latest ? new Date(latest).toLocaleDateString() : 'None yet',
        note: latest ? new Date(latest).toLocaleTimeString() : 'Waiting for first form',
      },
    ]
  }, [submissions])

  const monthlyBars = useMemo<BarDatum[]>(() => {
    const counts = new Map<string, { label: string; index: number; value: number }>()

    submissions.forEach((submission) => {
      const createdAt = new Date(submission.createdAt)
      const index = createdAt.getFullYear() * 12 + createdAt.getMonth()
      const label = createdAt.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      const current = counts.get(String(index))
      counts.set(String(index), {
        label,
        index,
        value: (current?.value ?? 0) + 1,
      })
    })

    return Array.from(counts.values())
      .sort((left, right) => left.index - right.index)
      .slice(-6)
      .map(({ label, value }) => ({ label, value }))
  }, [submissions])

  const returnBars = useMemo<BarDatum[]>(() => {
    const returned = submissions.filter((submission) => submission.materialsReturned).length
    return [
      { label: 'Returned', value: returned },
      { label: 'Pending', value: submissions.length - returned },
    ]
  }, [submissions])

  const returnedSubmissions = useMemo(
    () => submissions.filter((submission) => submission.materialsReturned),
    [submissions],
  )

  const pendingSubmissions = useMemo(
    () => submissions.filter((submission) => !submission.materialsReturned),
    [submissions],
  )

  const selectedSubmission = submissions.find((submission) => submission._id === selectedId) ?? null

  const refresh = async () => {
    if (!token) {
      return
    }

    const response = await api.forms.list(token)
    setSubmissions(response.data)
  }

  const toggleReturned = async (submission: FormSubmission) => {
    if (!token) {
      return
    }

    setSavingId(submission._id)

    try {
      const response = await api.forms.update(
        submission._id,
        { materialsReturned: !submission.materialsReturned },
        token,
      )
      setSubmissions((current) =>
        current.map((item) => (item._id === submission._id ? response.data : item)),
      )
      setSelectedId(submission._id)
    } finally {
      setSavingId(null)
    }
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
              <h1 className="mt-1 text-3xl font-semibold text-[#1f132d]">Website monitoring center</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Track submissions, review every customer field, and mark materials as returned from one clean control panel.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-full border border-[#e3d3ff] bg-white px-5 py-3 text-sm font-semibold text-[#6f2dbd] transition hover:bg-[#faf5ff]"
              >
                Refresh
              </button>
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-[1.75rem] border border-[#ecdfff] bg-white/90 p-5 shadow-[0_20px_60px_rgba(72,27,95,0.08)]"
            >
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold text-[#1f132d]">{metric.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{metric.note}</p>
            </article>
          ))}
        </section>

        {status === 'loading' ? (
          <div className="rounded-2xl border border-[#f0e6ff] bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-[0_20px_60px_rgba(72,27,95,0.08)]">
            Loading submissions...
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-[0_20px_60px_rgba(72,27,95,0.08)]">
            {message}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6 rounded-[2rem] border border-[#ecdfff] bg-white/90 p-5 shadow-[0_20px_60px_rgba(72,27,95,0.08)]">
            <div className="rounded-[1.5rem] border border-[#f0e6ff] bg-[#fbf8ff] p-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'dashboard' as const, label: 'Dashboard' },
                  { key: 'returned' as const, label: 'Returned client form' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActivePanel(item.key)}
                    className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      activePanel === item.key
                        ? 'bg-[#6f2dbd] text-white shadow-[0_12px_24px_rgba(111,45,189,0.24)]'
                        : 'bg-white text-[#6f2dbd] hover:bg-[#f5efff]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b5cf6]">
                Chart summary
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#1f132d]">Monthly submissions</h2>
              <p className="mt-1 text-sm text-slate-600">Shows how many forms came in per month.</p>
            </div>
            <MiniBarChart data={monthlyBars} tone="purple" emptyLabel="No submissions yet." />

            <div>
              <h2 className="text-xl font-semibold text-[#1f132d]">Return status</h2>
              <p className="mt-1 text-sm text-slate-600">Returned versus yet-to-return materials.</p>
            </div>
            <MiniBarChart data={returnBars} tone="rose" emptyLabel="No return data yet." />

            <div>
              <h2 className="text-xl font-semibold text-[#1f132d]">Submissions table</h2>
              <p className="mt-1 text-sm text-slate-600">Click any row to inspect every field.</p>
            </div>
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-100">
              <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>Bride</span>
                <span>Date</span>
                <span>Return</span>
              </div>
              <div className="max-h-[480px] divide-y divide-slate-100 overflow-auto">
                {submissions.map((submission) => {
                  const isActive = submission._id === selectedId
                  return (
                    <button
                      key={submission._id}
                      type="button"
                      onClick={() => setSelectedId(submission._id)}
                      className={`grid w-full grid-cols-[1.2fr_0.9fr_0.9fr] gap-3 px-4 py-4 text-left transition ${
                        isActive ? 'bg-[#faf5ff]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-semibold text-[#1f132d]">{submission.brideName}</span>
                      <span className="text-slate-600">{submission.weddingDate}</span>
                      <span className="text-slate-600">
                        {submission.materialsReturned ? 'Returned' : 'Pending'}
                      </span>
                    </button>
                  )
                })}

                {submissions.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-500">No submissions yet.</div>
                ) : null}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#1f132d]">Yet to return materials</h2>
              <p className="mt-1 text-sm text-slate-600">Names and phone numbers for follow-up.</p>
            </div>
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-100">
              <div className="grid grid-cols-[1.2fr_0.8fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>Name</span>
                <span>Phone</span>
              </div>
              <div className="divide-y divide-slate-100">
                {pendingSubmissions.map((submission) => (
                  <div key={submission._id} className="grid grid-cols-[1.2fr_0.8fr] gap-3 px-4 py-4 text-sm">
                    <span className="font-semibold text-[#1f132d]">{submission.brideName}</span>
                    <span className="text-slate-600">{submission.bridePhone}</span>
                  </div>
                ))}
                {pendingSubmissions.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-500">
                    Everyone has returned their materials.
                  </div>
                ) : null}
              </div>
            </div>
          </aside>

          <aside className="rounded-[2rem] border border-[#ecdfff] bg-white/90 p-6 shadow-[0_20px_60px_rgba(72,27,95,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b5cf6]">
                  {activePanel === 'returned' ? 'Returned client form' : 'Submission detail'}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1f132d]">
                  {selectedSubmission?.brideName || 'Select a submission'}
                </h2>
              </div>

              {selectedSubmission ? (
                <button
                  type="button"
                  disabled={savingId === selectedSubmission._id}
                  onClick={() => void toggleReturned(selectedSubmission)}
                  className="rounded-full bg-[#6f2dbd] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5c24a0] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingId === selectedSubmission._id
                    ? 'Saving...'
                    : selectedSubmission.materialsReturned
                      ? 'Mark pending'
                      : 'Mark returned'}
                </button>
              ) : null}
            </div>

            {activePanel === 'returned' ? (
              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100">
                <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>Bride</span>
                  <span>Phone</span>
                  <span>Returned</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {returnedSubmissions.map((submission) => (
                    <button
                      key={submission._id}
                      type="button"
                      onClick={() => setSelectedId(submission._id)}
                      className={`grid w-full grid-cols-[1.2fr_0.8fr_0.8fr] gap-3 px-4 py-4 text-left transition ${
                        selectedSubmission?._id === submission._id ? 'bg-[#faf5ff]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-semibold text-[#1f132d]">{submission.brideName}</span>
                      <span className="text-slate-600">{submission.bridePhone}</span>
                      <span className="text-slate-600">Yes</span>
                    </button>
                  ))}
                  {returnedSubmissions.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-500">
                      No returned clients yet.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : selectedSubmission ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {detailFields.map((field) => (
                  <DetailCard
                    key={field.key}
                    label={field.label}
                    value={formatFieldValue(selectedSubmission[field.key], field.key)}
                    multiline={
                      field.key === 'removedItems' ||
                      field.key === 'homeAddress' ||
                      field.key === 'churchAddress' ||
                      field.key === 'husbandAddress' ||
                      field.key === 'socialAddress' ||
                      field.key === 'consultantSignature'
                    }
                  />
                ))}
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

function MiniBarChart({
  data,
  tone,
  emptyLabel,
}: {
  data: BarDatum[]
  tone: 'purple' | 'rose'
  emptyLabel: string
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 0)

  if (data.length === 0 || maxValue === 0) {
    return <div className="rounded-2xl border border-dashed border-[#d8c1ff] bg-[#fcf9ff] p-4 text-sm text-slate-500">{emptyLabel}</div>
  }

  const fillClass = tone === 'purple' ? 'fill-[#8b5cf6]' : 'fill-[#ec4899]'

  return (
    <div className="rounded-2xl border border-[#f0e6ff] bg-[#fbf8ff] p-4">
      <svg viewBox="0 0 260 160" className="h-40 w-full">
        {data.map((item, index) => {
          const barHeight = Math.max((item.value / maxValue) * 96, 10)
          const x = 28 + index * 68
          const y = 118 - barHeight

          return (
            <g key={item.label}>
              <rect x={x} y={y} width="36" height={barHeight} rx="10" className={fillClass} />
              <text x={x + 18} y="136" textAnchor="middle" className="fill-slate-600 text-[10px] font-medium">
                {item.label}
              </text>
              <text x={x + 18} y={Math.max(y - 8, 14)} textAnchor="middle" className="fill-[#1f132d] text-[11px] font-semibold">
                {item.value}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function formatFieldValue(value: unknown, key: keyof FormSubmission) {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (!value) {
    return '—'
  }

  if (key === 'createdAt') {
    return new Date(String(value)).toLocaleString()
  }

  return String(value)
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
