import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

type SummaryState = {
  total: number
  returned: number
  pending: number
  latestCreatedAt: string | null
}

const TABLE_PAGE_SIZE = 25

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
  { label: 'Policy acknowledged', key: 'policyAcknowledged' },
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
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const detailsScrollRef = useRef<HTMLDivElement | null>(null)
  const returnedScrollRef = useRef<HTMLDivElement | null>(null)
  const returnedLoadMoreRef = useRef<HTMLDivElement | null>(null)
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<'dashboard' | 'details' | 'returned'>('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [summary, setSummary] = useState<SummaryState>({
    total: 0,
    returned: 0,
    pending: 0,
    latestCreatedAt: null,
  })
  const [pagination, setPagination] = useState({ page: 1, limit: TABLE_PAGE_SIZE, total: 0, hasMore: false })
  const [loadingMore, setLoadingMore] = useState(false)

  const loadSummary = useCallback(async () => {
    if (!token) {
      return
    }

    const response = await api.forms.summary(token)
    setSummary(response.data)
  }, [token])

  const loadPage = useCallback(async (page: number, mode: 'replace' | 'append' = 'replace') => {
    if (!token) {
      return null
    }

    if (mode === 'append') {
      setLoadingMore(true)
    } else {
      setStatus('loading')
    }

    try {
      const response = await api.forms.list(token, { page, limit: TABLE_PAGE_SIZE })
      setSubmissions((current) =>
        mode === 'append' ? [...current, ...response.data] : response.data,
      )
      setPagination(
        response.pagination || {
          page,
          limit: TABLE_PAGE_SIZE,
          total: response.data.length,
          hasMore: false,
        },
      )
      setSelectedId((current) => current ?? response.data[0]?._id ?? null)
      setStatus('idle')
      return response
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Unable to load submissions.')
      return null
    } finally {
      setLoadingMore(false)
    }
  }, [token])

  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || loadingMore || status === 'loading') {
      return
    }

    await loadPage(pagination.page + 1, 'append')
  }, [loadPage, loadingMore, pagination.hasMore, pagination.page, status])

  useEffect(() => {
    if (!token) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        const initialPage = await loadPage(1, 'replace')

        try {
          await loadSummary()
        } catch {
          if (initialPage) {
            const returned = initialPage.data.filter((submission) => submission.materialsReturned).length
            setSummary({
              total: initialPage.pagination?.total ?? initialPage.data.length,
              returned,
              pending: (initialPage.pagination?.total ?? initialPage.data.length) - returned,
              latestCreatedAt: initialPage.data[0]?.createdAt ?? null,
            })
          }
        }
      })()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadPage, loadSummary, token])

  useEffect(() => {
    const root = detailsScrollRef.current
    const target = loadMoreRef.current
    if (!root || !target || activePanel !== 'details' || !pagination?.hasMore || loadingMore) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting && !loadingMore && pagination?.hasMore) {
          void loadMore()
        }
      },
      { root, rootMargin: '180px 0px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [activePanel, loadMore, loadingMore, pagination.hasMore])

  useEffect(() => {
    const root = returnedScrollRef.current
    const target = returnedLoadMoreRef.current
    if (!root || !target || activePanel !== 'returned' || !pagination?.hasMore || loadingMore) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting && !loadingMore && pagination?.hasMore) {
          void loadMore()
        }
      },
      { root, rootMargin: '180px 0px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [activePanel, loadMore, loadingMore, pagination.hasMore])

  const metrics = useMemo<Metric[]>(() => {
    const latest = summary.latestCreatedAt

    return [
      { label: 'Total submissions', value: String(summary.total), note: 'All form entries received' },
      { label: 'Materials returned', value: String(summary.returned), note: 'Marked as returned' },
      { label: 'Yet to return', value: String(summary.pending), note: 'Still pending on the dashboard' },
      {
        label: 'Latest entry',
        value: latest ? new Date(latest).toLocaleDateString() : 'None yet',
        note: latest ? new Date(latest).toLocaleTimeString() : 'Waiting for first form',
      },
    ]
  }, [summary])

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
    return [
      { label: 'Returned', value: summary.returned },
      { label: 'Pending', value: summary.pending },
    ]
  }, [summary])

  const returnedSubmissions = useMemo(
    () => submissions.filter((submission) => submission.materialsReturned),
    [submissions],
  )

  const pendingSubmissions = useMemo(
    () => submissions.filter((submission) => !submission.materialsReturned),
    [submissions],
  )

  const selectedSubmission = submissions.find((submission) => submission._id === selectedId) ?? null
  const previewSubmission = submissions.find((submission) => submission._id === previewId) ?? null

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false)
  }, [])

  const openPanel = useCallback((panel: 'dashboard' | 'details' | 'returned') => {
    setActivePanel(panel)
    setIsSidebarOpen(false)
  }, [])

  const refresh = useCallback(async () => {
    const firstPage = await loadPage(1, 'replace')

    try {
      await loadSummary()
    } catch {
      if (firstPage) {
        const returned = firstPage.data.filter((submission) => submission.materialsReturned).length
        setSummary({
          total: firstPage.pagination?.total ?? firstPage.data.length,
          returned,
          pending: (firstPage.pagination?.total ?? firstPage.data.length) - returned,
          latestCreatedAt: firstPage.data[0]?.createdAt ?? null,
        })
      }
    }
  }, [loadPage, loadSummary])

  const toggleReturned = useCallback(
    async (submission: FormSubmission) => {
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
        await loadSummary()
      } finally {
        setSavingId(null)
      }
    },
    [loadSummary, token],
  )

  const requestToggleReturned = useCallback(
    async (submission: FormSubmission) => {
      const targetState = submission.materialsReturned ? 'pending' : 'returned'
      const confirmed = window.confirm(`Are you sure you want to mark this submission as ${targetState}?`)

      if (!confirmed) {
        return
      }

      await toggleReturned(submission)
    },
    [toggleReturned],
  )

  return (
    <main className="min-h-screen bg-[#eef5ef] text-slate-900">
      <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_20px_70px_rgba(7,94,44,0.10)]">
          <div className="grid min-h-screen lg:grid-cols-[270px_minmax(0,1fr)]">
            {isSidebarOpen ? (
              <button
                type="button"
                aria-label="Close sidebar overlay"
                onClick={closeSidebar}
                className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              />
            ) : null}

            <aside
              className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col bg-[#0b5f32] text-white transition-transform duration-300 lg:static lg:w-auto lg:translate-x-0 ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
              }`}
            >
              <div className="border-b border-white/10 px-6 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-100/80">Jordela Bridals</p>
                    <h1 className="mt-2 text-2xl font-semibold">Admin Console</h1>
                    <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                      Monitor bookings, returns, and customer details from one place.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeSidebar}
                    className="rounded-full border border-white/20 px-3 py-2 text-sm font-semibold text-white lg:hidden"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <nav className="space-y-2 px-4 py-5">
                {[
                  { key: 'dashboard' as const, label: 'Dashboard' },
                  { key: 'details' as const, label: 'Submission details' },
                  { key: 'returned' as const, label: 'Returned client form' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => openPanel(item.key)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      activePanel === item.key
                        ? 'bg-white text-[#0b5f32] shadow-[0_12px_30px_rgba(0,0,0,0.10)]'
                        : 'text-emerald-50/90 hover:bg-white/10'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs opacity-70">›</span>
                  </button>
                ))}
              </nav>

              <div className="mt-auto border-t border-white/10 px-6 py-6">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">Signed in as</p>
                <p className="mt-2 text-sm font-semibold">
                  {user?.name} {user?.role ? `• ${user.role}` : ''}
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => void refresh()}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0b5f32] transition hover:bg-emerald-50"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      signOut()
                      navigate('/auth', { replace: true })
                    }}
                    className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </aside>

            <section className="flex min-h-screen flex-col bg-[#eef5ef]">
              <header className="border-b border-emerald-100 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 sm:py-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setIsSidebarOpen(true)}
                      className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-xl font-semibold text-[#0b5f32] shadow-sm lg:hidden"
                      aria-label="Open sidebar"
                    >
                      ☰
                    </button>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0b5f32]">
                        Dashboard overview
                      </p>
                      <h2 className="mt-1 text-3xl font-semibold text-[#10261a]">
                        {activePanel === 'returned'
                          ? 'Returned client form'
                          : activePanel === 'details'
                            ? 'Submission details'
                            : 'Website monitoring center'}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        Track every bridal submission, review details, and manage returned materials with a clean operations view.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void refresh()}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-[#0b5f32] transition hover:bg-emerald-100"
                  >
                    Sync data
                  </button>
                </div>
              </header>

              <div className="flex-1 space-y-6 p-6">
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {metrics.map((metric) => (
                    <article
                      key={metric.label}
                      className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-[0_16px_40px_rgba(7,94,44,0.08)]"
                    >
                      <p className="text-sm text-slate-500">{metric.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-[#10261a]">{metric.value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{metric.note}</p>
                    </article>
                  ))}
                </section>

                {status === 'loading' ? (
                  <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_12px_30px_rgba(7,94,44,0.08)]">
                    Loading submissions...
                  </div>
                ) : null}

                {status === 'error' ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-[0_12px_30px_rgba(7,94,44,0.08)]">
                    {message}
                  </div>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
                  <aside className="space-y-6 rounded-[24px] border border-emerald-100 bg-white p-5 shadow-[0_16px_40px_rgba(7,94,44,0.08)]">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0b5f32]">
                        Analytics
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[#10261a]">Monthly submissions</h3>
                      <p className="mt-1 text-sm text-slate-600">Recent form counts by month.</p>
                    </div>
                    <MiniBarChart data={monthlyBars} tone="green" emptyLabel="No submissions yet." />

                    <div>
                      <h3 className="text-xl font-semibold text-[#10261a]">Return status</h3>
                      <p className="mt-1 text-sm text-slate-600">Returned versus pending materials.</p>
                    </div>
                    <MiniBarChart data={returnBars} tone="amber" emptyLabel="No return data yet." />

                    <div>
                      <h3 className="text-xl font-semibold text-[#10261a]">Yet to return</h3>
                      <p className="mt-1 text-sm text-slate-600">Name and phone for follow-up.</p>
                    </div>
                    <div className="overflow-hidden rounded-[20px] border border-slate-100">
                      <div className="grid grid-cols-[1.2fr_0.8fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <span>Name</span>
                        <span>Phone</span>
                      </div>
                      <div className="max-h-[340px] divide-y divide-slate-100 overflow-auto">
                        {pendingSubmissions.map((submission) => (
                          <button
                            key={submission._id}
                            type="button"
                            onClick={() => {
                              setSelectedId(submission._id)
                              setPreviewId(submission._id)
                              setActivePanel('details')
                            }}
                            className="grid w-full grid-cols-[1.2fr_0.8fr] gap-3 px-4 py-4 text-left text-sm transition hover:bg-slate-50"
                          >
                            <span className="font-semibold text-[#10261a]">{submission.brideName}</span>
                            <span className="text-slate-600">{submission.bridePhone}</span>
                          </button>
                        ))}
                        {pendingSubmissions.length === 0 ? (
                          <div className="px-4 py-10 text-center text-sm text-slate-500">
                            Everyone has returned their materials.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </aside>

                  <aside className="rounded-[24px] border border-emerald-100 bg-white p-6 shadow-[0_16px_40px_rgba(7,94,44,0.08)]">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0b5f32]">
                          {activePanel === 'returned'
                            ? 'Returned client form'
                            : activePanel === 'details'
                              ? 'Submission detail'
                              : 'Dashboard overview'}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-[#10261a]">
                          {selectedSubmission?.brideName || 'Select a submission'}
                        </h3>
                      </div>

                      {selectedSubmission ? (
                        <button
                          type="button"
                          disabled={savingId === selectedSubmission._id}
                          onClick={() => void requestToggleReturned(selectedSubmission)}
                          className="rounded-full bg-[#0b5f32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#094d29] disabled:cursor-not-allowed disabled:opacity-70"
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
                      <div className="mt-6 space-y-4">
                        <div className="overflow-hidden rounded-[20px] border border-slate-100">
                          <div className="grid grid-cols-[1.2fr_0.8fr_0.9fr_0.7fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            <span>Bride</span>
                            <span>Phone</span>
                            <span>Wedding date</span>
                            <span>Status</span>
                          </div>
                          <div
                            ref={returnedScrollRef}
                            className="max-h-[520px] divide-y divide-slate-100 overflow-auto"
                          >
                            {returnedSubmissions.map((submission) => (
                              <button
                                key={submission._id}
                                type="button"
                                onClick={() => {
                                  setSelectedId(submission._id)
                                  setPreviewId(submission._id)
                                }}
                                className={`grid w-full grid-cols-[1.2fr_0.8fr_0.9fr_0.7fr] gap-3 px-4 py-4 text-left transition ${
                                  selectedSubmission?._id === submission._id ? 'bg-emerald-50' : 'hover:bg-slate-50'
                                }`}
                              >
                                <span className="font-semibold text-[#10261a]">{submission.brideName}</span>
                                <span className="text-slate-600">{submission.bridePhone}</span>
                                <span className="text-slate-600">{submission.weddingDate}</span>
                                <span className="text-slate-600">Returned</span>
                              </button>
                            ))}
                            {returnedSubmissions.length === 0 ? (
                              <div className="px-4 py-10 text-center text-sm text-slate-500">
                                No returned clients yet.
                              </div>
                            ) : null}
                            <div ref={returnedLoadMoreRef} className="h-6" />
                            <div className="px-4 py-4 text-center text-xs text-slate-400">
                              {loadingMore
                                ? 'Loading more returned clients...'
                                : pagination.hasMore
                                  ? 'Scroll to load more'
                                  : 'All records loaded'}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {selectedSubmission ? (
                            detailFields.slice(0, 12).map((field) => (
                              <DetailCard
                                key={field.key}
                                label={field.label}
                                value={formatFieldValue(selectedSubmission[field.key], field.key)}
                                multiline={
                                  field.key === 'removedItems' ||
                                  field.key === 'homeAddress' ||
                                  field.key === 'churchAddress' ||
                                  field.key === 'husbandAddress' ||
                                  field.key === 'socialAddress'
                                }
                              />
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-6 text-sm leading-6 text-slate-600">
                              Select a returned row to preview the client details here.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : activePanel === 'details' ? (
                      <div className="mt-6 space-y-4">
                        <div className="overflow-hidden rounded-[20px] border border-slate-100">
                          <div className="min-w-[840px]">
                            <div className="grid grid-cols-[1.3fr_0.9fr_0.8fr_0.8fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              <span>Bride</span>
                              <span>Phone</span>
                              <span>Wedding date</span>
                              <span>Status</span>
                            </div>
                            <div
                              ref={detailsScrollRef}
                              className="max-h-[520px] divide-y divide-slate-100 overflow-auto"
                            >
                              {submissions.map((submission) => (
                                <button
                                  key={submission._id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedId(submission._id)
                                    setPreviewId(submission._id)
                                  }}
                                  className={`grid w-full grid-cols-[1.3fr_0.9fr_0.8fr_0.8fr] gap-3 px-4 py-4 text-left transition ${
                                    selectedSubmission?._id === submission._id ? 'bg-emerald-50' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="font-semibold text-[#10261a]">{submission.brideName}</span>
                                  <span className="text-slate-600">{submission.bridePhone}</span>
                                  <span className="text-slate-600">{submission.weddingDate}</span>
                                  <span className="text-slate-600">
                                    {submission.materialsReturned ? 'Returned' : 'Pending'}
                                  </span>
                                </button>
                              ))}
                              {submissions.length === 0 ? (
                                <div className="px-4 py-10 text-center text-sm text-slate-500">
                                  No submissions yet.
                                </div>
                              ) : null}
                              <div ref={loadMoreRef} className="h-6" />
                              <div className="px-4 pb-4 text-center text-xs text-slate-400">
                                {loadingMore
                                  ? 'Loading more submissions...'
                                  : pagination.hasMore
                                    ? 'Scroll to load more'
                                    : 'All records loaded'}
                              </div>
                            </div>
                          </div>
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
                      <div className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-6 text-sm leading-6 text-slate-600">
                        Pick a row on the left to inspect the submission in detail.
                      </div>
                    )}
                  </aside>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {previewSubmission ? (
        <SubmissionPreviewModal
          submission={previewSubmission}
          onClose={() => setPreviewId(null)}
          onToggleReturned={() => void requestToggleReturned(previewSubmission)}
          saving={savingId === previewSubmission._id}
        />
      ) : null}
    </main>
  )
}

function MiniBarChart({
  data,
  tone,
  emptyLabel,
}: {
  data: BarDatum[]
  tone: 'green' | 'amber'
  emptyLabel: string
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 0)

  if (data.length === 0 || maxValue === 0) {
    return <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-500">{emptyLabel}</div>
  }

  const fillClass = tone === 'green' ? 'fill-[#0b5f32]' : 'fill-[#d97706]'

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4">
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
              <text x={x + 18} y={Math.max(y - 8, 14)} textAnchor="middle" className="fill-[#10261a] text-[11px] font-semibold">
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
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-2 text-sm leading-6 text-[#10261a] ${multiline ? 'whitespace-pre-line' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function SubmissionPreviewModal({
  submission,
  onClose,
  onToggleReturned,
  saving,
}: {
  submission: FormSubmission
  onClose: () => void
  onToggleReturned: () => void
  saving: boolean
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d2416]/70 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[30px] border border-emerald-100 bg-white shadow-[0_30px_120px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between gap-4 border-b border-emerald-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b5f32]">Submission preview</p>
            <h3 className="mt-1 text-2xl font-semibold text-[#10261a]">{submission.brideName}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {submission.bridePhone} • {submission.weddingDate}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleReturned}
              className="rounded-full bg-[#0b5f32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#094d29] disabled:opacity-70"
              disabled={saving}
            >
              {saving ? 'Saving...' : submission.materialsReturned ? 'Mark pending' : 'Mark returned'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-96px)] overflow-auto px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {detailFields.map((field) => (
              <DetailCard
                key={field.key}
                label={field.label}
                value={formatFieldValue(submission[field.key], field.key)}
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
        </div>
      </div>
    </div>
  )
}
