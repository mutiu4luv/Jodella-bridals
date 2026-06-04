import { useState, type ChangeEvent, type ChangeEventHandler, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import logoImage from '../assets/logo.jpeg'
import heroImage from '../assets/hero.png'
import { api } from '../lib/api'

type FormState = {
  brideName: string
  bridePhone: string
  homeAddress: string
  socialAddress: string
  weddingDate: string
  husbandName: string
  husbandPhone: string
  husbandAddress: string
  stateCity: string
  churchAddress: string
  weddingCardCopyType: string
  packageName: string
  packageAllItems: boolean
  packageItemA: string
  packageItemB: string
  packageItemC: string
  packageItemD: string
  packageItemE: string
  packageItemF: string
  removedItems: string
  cautionFeeAcknowledged: boolean
  identificationSubmitted: boolean
  adjustmentAcknowledged: boolean
  returnDurationAcknowledged: boolean
  pickupAcknowledged: boolean
  fireworksAcknowledged: boolean
  cancellationAcknowledged: boolean
  damagedItemAcknowledged: boolean
  valueAcknowledged: boolean
  customerSignature: string
  consultantSignature: string
  mdSignature: string
  signatureDate: string
}

const initialForm: FormState = {
  brideName: '',
  bridePhone: '',
  homeAddress: '',
  socialAddress: '',
  weddingDate: '',
  husbandName: '',
  husbandPhone: '',
  husbandAddress: '',
  stateCity: '',
  churchAddress: '',
  weddingCardCopyType: 'softcopy',
  packageName: '',
  packageAllItems: true,
  packageItemA: '',
  packageItemB: '',
  packageItemC: '',
  packageItemD: '',
  packageItemE: '',
  packageItemF: '',
  removedItems: '',
  cautionFeeAcknowledged: false,
  identificationSubmitted: false,
  adjustmentAcknowledged: false,
  returnDurationAcknowledged: false,
  pickupAcknowledged: false,
  fireworksAcknowledged: false,
  cancellationAcknowledged: false,
  damagedItemAcknowledged: false,
  valueAcknowledged: false,
  customerSignature: '',
  consultantSignature: '',
  mdSignature: '',
  signatureDate: '',
}

const policyItems = [
  {
    title: 'Copy of Wedding Card',
    body: 'To be submitted either by hardcopy or softcopy before pickup.',
  },
  {
    title: 'Rental package chosen',
    body: 'Indicate if the bride is booking all listed items or removing any items from the chosen package.',
  },
  {
    title: 'Caution fee',
    body: 'A refundable caution fee of N20,000 must be deposited before items leave the store and is refunded once items are returned in good condition.',
  },
  {
    title: 'Damages',
    body: 'Loss attracts full replacement cost, tears on gowns void caution refund, and serious stains attract a 50% deduction from the caution fee.',
  },
  {
    title: 'Identification',
    body: 'Wedding invitation card is required before pickup. If no wedding IV is available, a valid means of identification must be submitted.',
  },
  {
    title: 'Adjustments',
    body: 'If the gown requires alteration, the bride and Jodella share the extra cost equally on a 50-50 basis.',
  },
  {
    title: 'Return duration',
    body: 'All rented items must be returned within 2 days after the event. Late return attracts a daily fine of N5,000.',
  },
  {
    title: 'Pickup and delivery',
    body: 'Owerri brides pick up from 12 noon on Fridays. Brides from other listed cities pick up or waybill two days before the wedding day. Transportation is borne by the bride both ways.',
  },
  {
    title: 'Fireworks',
    body: 'Fireworks near the bride are not allowed because they can burn the gown and attract full purchase cost at current market value.',
  },
  {
    title: 'Cancellation or date change',
    body: 'This business operates a no-refund policy after payment. Cancellation or date changes must be communicated at least two weeks before the booked date.',
  },
  {
    title: 'Damaged items and value',
    body: 'Return all items in good condition and remember that all rental items are valued using the current market price in case of loss.',
  },
]

export default function UserFormPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [submittedForm, setSubmittedForm] = useState<FormState | null>(null)
  const navigate = useNavigate()

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, type } = event.target
    const field = name as keyof FormState

    if (type === 'checkbox') {
      updateField(field, (event.target as HTMLInputElement).checked as FormState[typeof field])
      return
    }

    updateField(field, event.target.value as FormState[typeof field])
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('submitting')
    setMessage('')

    try {
      await api.forms.create(form)
      setStatus('success')
      setMessage('Form submitted successfully.')
      setSubmittedForm(form)
      setForm(initialForm)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Submission failed.')
    }
  }

  const downloadReceipt = () => {
    if (!submittedForm) {
      return
    }

    const lines = [
      'Jodella Bridal Form Confirmation',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Bride Name: ${submittedForm.brideName}`,
      `Bride Phone: ${submittedForm.bridePhone}`,
      `Home Address: ${submittedForm.homeAddress}`,
      `FB/IG Address: ${submittedForm.socialAddress}`,
      `Wedding Date: ${submittedForm.weddingDate}`,
      `Husband/Other Relations Name: ${submittedForm.husbandName}`,
      `Husband/Other Relations Phone: ${submittedForm.husbandPhone}`,
      `Husband/Other Relations Address: ${submittedForm.husbandAddress}`,
      `State/City: ${submittedForm.stateCity}`,
      `Church Name & Address: ${submittedForm.churchAddress}`,
      `Wedding Card Copy Type: ${submittedForm.weddingCardCopyType}`,
      `Rental Package Chosen: ${submittedForm.packageName}`,
      `Booking All Items: ${submittedForm.packageAllItems ? 'Yes' : 'No'}`,
      `Package Item A: ${submittedForm.packageItemA}`,
      `Package Item B: ${submittedForm.packageItemB}`,
      `Package Item C: ${submittedForm.packageItemC}`,
      `Package Item D: ${submittedForm.packageItemD}`,
      `Package Item E: ${submittedForm.packageItemE}`,
      `Package Item F: ${submittedForm.packageItemF}`,
      `Removed Items / Notes: ${submittedForm.removedItems}`,
      `Caution Fee Acknowledged: ${submittedForm.cautionFeeAcknowledged ? 'Yes' : 'No'}`,
      `Identification Submitted: ${submittedForm.identificationSubmitted ? 'Yes' : 'No'}`,
      `Adjustment Acknowledged: ${submittedForm.adjustmentAcknowledged ? 'Yes' : 'No'}`,
      `Return Duration Acknowledged: ${submittedForm.returnDurationAcknowledged ? 'Yes' : 'No'}`,
      `Pickup Acknowledged: ${submittedForm.pickupAcknowledged ? 'Yes' : 'No'}`,
      `Fireworks Acknowledged: ${submittedForm.fireworksAcknowledged ? 'Yes' : 'No'}`,
      `Cancellation Acknowledged: ${submittedForm.cancellationAcknowledged ? 'Yes' : 'No'}`,
      `Damaged Item Acknowledged: ${submittedForm.damagedItemAcknowledged ? 'Yes' : 'No'}`,
      `Value Acknowledged: ${submittedForm.valueAcknowledged ? 'Yes' : 'No'}`,
      `Customer Signature: ${submittedForm.customerSignature}`,
      `Consultant Signature: ${submittedForm.consultantSignature}`,
      `M.D Signature: ${submittedForm.mdSignature}`,
      `Signature Date: ${submittedForm.signatureDate}`,
    ]

    const file = new Blob([`${lines.join('\n')}\n`], { type: 'text/plain;charset=utf-8' })
    const downloadUrl = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = downloadUrl
    anchor.download = `jodella-bridal-form-${submittedForm.brideName || 'submission'}.txt`
    anchor.click()
    URL.revokeObjectURL(downloadUrl)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,132,255,0.22),_transparent_32%),linear-gradient(180deg,_#fffafc_0%,_#f5efff_55%,_#ffffff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/70 bg-white/80 px-6 py-4 shadow-[0_24px_90px_rgba(72,27,95,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <img
              src={logoImage}
              alt="Jodella Bridals logo"
              className="h-14 w-14 rounded-2xl object-cover shadow-sm ring-1 ring-black/5"
            />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b5cf6]">
                Welcome
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-[#1f132d]">Bridal intake form</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-full border border-[#e3d3ff] bg-white px-5 py-3 text-sm font-semibold text-[#6f2dbd] transition hover:bg-[#faf5ff]"
            >
              Login / Register
            </button>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_24px_90px_rgba(72,27,95,0.12)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(161,105,255,0.08),transparent_35%,rgba(255,255,255,0.65))]" />
          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#e8d9ff] bg-[#f8f2ff] px-4 py-2 text-sm font-semibold text-[#6f2dbd]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#a855f7]" />
                Jodella Bridal Booking Form
              </div>
              <div className="space-y-4">
                <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-[#1f132d] sm:text-5xl">
                  Know Your Customer form for bridal rentals and wedding support.
                </h2>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Complete the bride profile, package selection, and policy acknowledgements. Your
                  submission is saved for the admin dashboard.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['Refundable caution fee', 'N20,000'],
                  ['Late return fine', 'N5,000/day'],
                  ['Policy stance', 'No refund after payment'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-[#ecdfff] bg-white/85 p-4 shadow-sm"
                  >
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-lg font-semibold text-[#1f132d]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] border border-[#eadcff] bg-gradient-to-br from-[#231433] via-[#4f2077] to-[#8d4dff] p-6 text-white shadow-[0_20px_60px_rgba(79,32,119,0.3)]">
              <div className="absolute -right-12 top-8 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-fuchsia-300/20 blur-3xl" />
              <div className="relative space-y-4">
                <img
                  src={heroImage}
                  alt=""
                  className="mx-auto h-40 w-40 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
                />
                <div className="space-y-2 text-center">
                  <p className="text-sm uppercase tracking-[0.3em] text-white/75">Secure submission</p>
                  <h3 className="text-2xl font-semibold">Private booking intake</h3>
                  <p className="text-sm leading-6 text-white/80">
                    Authenticated users can submit the bridal form and keep the workflow neatly
                    organized.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 lg:mt-8">
          <section className="rounded-[2rem] border border-[#ecdfff] bg-white/90 p-6 shadow-[0_20px_60px_rgba(72,27,95,0.08)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b5cf6]">
                  Bride details
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#1f132d]">Customer information</h3>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-500">
                Name, contact, location, wedding, and church details are captured here exactly as
                they appear on the booking document.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <Field label="Name" name="brideName" value={form.brideName} onChange={handleChange} />
              <Field
                label="Phone No"
                name="bridePhone"
                value={form.bridePhone}
                onChange={handleChange}
              />
              <Field
                label="Home Address"
                name="homeAddress"
                value={form.homeAddress}
                onChange={handleChange}
                full
              />
              <Field
                label="FB/IG Address"
                name="socialAddress"
                value={form.socialAddress}
                onChange={handleChange}
                full
              />
              <Field
                label="Wedding Date"
                name="weddingDate"
                type="date"
                value={form.weddingDate}
                onChange={handleChange}
              />
              <Field
                label="Husband's / Other relations Name"
                name="husbandName"
                value={form.husbandName}
                onChange={handleChange}
              />
              <Field
                label="Phone No"
                name="husbandPhone"
                value={form.husbandPhone}
                onChange={handleChange}
              />
              <Field
                label="Address"
                name="husbandAddress"
                value={form.husbandAddress}
                onChange={handleChange}
                full
              />
              <Field
                label="State / City"
                name="stateCity"
                value={form.stateCity}
                onChange={handleChange}
              />
              <Field
                label="Church Name & Address"
                name="churchAddress"
                value={form.churchAddress}
                onChange={handleChange}
                full
              />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <article className="rounded-[2rem] border border-[#ecdfff] bg-white/90 p-6 shadow-[0_20px_60px_rgba(72,27,95,0.08)] sm:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b5cf6]">
                  Policy copy
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#1f132d]">
                  Terms and conditions
                </h3>
              </div>

              <div className="mt-6 space-y-4">
                {policyItems.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-[#f0e6ff] bg-[#fbf8ff] p-4">
                    <h4 className="text-base font-semibold text-[#27163b]">{item.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-[#ecdfff] bg-white/90 p-6 shadow-[0_20px_60px_rgba(72,27,95,0.08)] sm:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b5cf6]">
                  Booking details
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#1f132d]">Package and approvals</h3>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <SelectField
                  label="Wedding card copy type"
                  name="weddingCardCopyType"
                  value={form.weddingCardCopyType}
                  onChange={handleChange}
                  options={[
                    ['hardcopy', 'Hardcopy'],
                    ['softcopy', 'Softcopy'],
                    ['both', 'Both'],
                  ]}
                />

                <Field
                  label="Rental package chosen"
                  name="packageName"
                  value={form.packageName}
                  onChange={handleChange}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-[#d8c1ff] bg-[#fcf9ff] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold text-[#27163b]">Package notes</h4>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <input
                      type="checkbox"
                      name="packageAllItems"
                      checked={form.packageAllItems}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-slate-300 text-[#8b5cf6] focus:ring-[#8b5cf6]"
                    />
                    Booking all listed items
                  </label>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  If any item is removed from the package, write it clearly below.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[
                    ['a', 'packageItemA'],
                    ['b', 'packageItemB'],
                    ['c', 'packageItemC'],
                    ['d', 'packageItemD'],
                    ['e', 'packageItemE'],
                    ['f', 'packageItemF'],
                  ].map(([label, name]) => (
                    <Field
                      key={name}
                      label={label}
                      name={name as keyof FormState}
                      value={form[name as keyof FormState] as string}
                      onChange={handleChange}
                    />
                  ))}
                </div>
                <TextAreaField
                  label="Items removed or special package notes"
                  name="removedItems"
                  value={form.removedItems}
                  onChange={handleChange}
                />
              </div>

              <div className="mt-6 space-y-3">
                {[
                  ['cautionFeeAcknowledged', 'Caution fee policy acknowledged'],
                  ['identificationSubmitted', 'Wedding invitation or ID submitted'],
                  ['adjustmentAcknowledged', 'Alteration cost share understood'],
                  ['returnDurationAcknowledged', 'Return deadline and late fine accepted'],
                  ['pickupAcknowledged', 'Pickup / delivery terms understood'],
                  ['fireworksAcknowledged', 'Fireworks restriction accepted'],
                  ['cancellationAcknowledged', 'Cancellation policy accepted'],
                  ['damagedItemAcknowledged', 'Damaged item return policy accepted'],
                  ['valueAcknowledged', 'Market value replacement policy accepted'],
                ].map(([field, label]) => (
                  <label
                    key={field}
                    className="flex items-start gap-3 rounded-2xl border border-[#f0e6ff] bg-[#fbf8ff] px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      name={field}
                      checked={form[field as keyof FormState] as boolean}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#8b5cf6] focus:ring-[#8b5cf6]"
                    />
                    <span className="text-sm leading-6 text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-[2rem] border border-[#ecdfff] bg-white/90 p-6 shadow-[0_20px_60px_rgba(72,27,95,0.08)] sm:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b5cf6]">
                Sign off
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#1f132d]">Customer and staff sign and date</h3>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <Field
                label="Customer"
                name="customerSignature"
                value={form.customerSignature}
                onChange={handleChange}
              />
              <Field
                label="Consultant"
                name="consultantSignature"
                value={form.consultantSignature}
                onChange={handleChange}
              />
              <Field label="M.D" name="mdSignature" value={form.mdSignature} onChange={handleChange} />
              <Field
                label="Sign and Date"
                name="signatureDate"
                type="date"
                value={form.signatureDate}
                onChange={handleChange}
              />
            </div>
          </section>

          <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-[#ecdfff] bg-white/90 p-6 shadow-[0_20px_60px_rgba(72,27,95,0.08)] sm:flex-row sm:items-center sm:p-8">
            <div>
              <p className="text-sm font-medium text-slate-500">Submission status</p>
              <p
                className={`mt-1 text-lg font-semibold ${
                  status === 'success'
                    ? 'text-emerald-600'
                    : status === 'error'
                      ? 'text-rose-600'
                      : 'text-[#1f132d]'
                }`}
              >
                {message || 'Ready to submit.'}
              </p>
              {status === 'success' && submittedForm ? (
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  A downloadable confirmation is ready with every field you submitted.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              {status === 'success' && submittedForm ? (
                <button
                  type="button"
                  onClick={downloadReceipt}
                  className="inline-flex items-center justify-center rounded-full border border-[#e3d3ff] bg-white px-6 py-3 text-sm font-semibold text-[#6f2dbd] shadow-[0_14px_30px_rgba(111,45,189,0.12)] transition hover:bg-[#faf5ff]"
                >
                  Download confirmation
                </button>
              ) : null}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="inline-flex items-center justify-center rounded-full bg-[#6f2dbd] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(111,45,189,0.28)] transition hover:bg-[#5c24a0] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === 'submitting' ? 'Submitting...' : 'Submit form'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}

type FieldProps = {
  label: string
  name: keyof FormState
  value: string
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  type?: string
  full?: boolean
}

function Field({ label, name, value, onChange, type = 'text', full }: FieldProps) {
  return (
    <label className={full ? 'md:col-span-2' : ''}>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10"
      />
    </label>
  )
}

type SelectFieldProps = {
  label: string
  name: keyof FormState
  value: string
  onChange: ChangeEventHandler<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>
  options: Array<[string, string]>
}

function SelectField({ label, name, value, onChange, options }: SelectFieldProps) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

type TextAreaFieldProps = {
  label: string
  name: keyof FormState
  value: string
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
}

function TextAreaField({ label, name, value, onChange }: TextAreaFieldProps) {
  return (
    <label className="mt-4 block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10"
      />
    </label>
  )
}
