import { useState, type ChangeEvent, type ChangeEventHandler, type FormEvent, type Ref } from 'react'
import { useNavigate } from 'react-router-dom'
import logoImage from '../assets/logo.jpeg'
import secondImage from '../assets/second.jpeg'
import thirdImage from '../assets/third.jpeg'
import fourthImage from '../assets/fourth.jpeg'
import fifthImage from '../assets/fifth.jpeg'
import sixthImage from '../assets/sixth.jpeg'
import firstImage from '../assets/first.jpeg'
import heroVideo from '../assets/video.mp4'
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
  packageName: string
  packageImageUrl: string
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
  policyAcknowledged: boolean
  idCardUrl: string
  idCardName: string
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
  packageName: '',
  packageImageUrl: '',
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
  policyAcknowledged: false,
  idCardUrl: '',
  idCardName: '',
}

const policyItems = [
  {
    title: 'Copy of Wedding Card',
    body: 'To be submitted either by hardcopy or softcopy before pickup.',
  },
  // {
  //   title: 'Rental package chosen',
  //   body: 'Indicate if the bride is booking all listed items or removing any items from the chosen package.',
  // },
  {
    title: 'Caution fee',
    body: 'A refundable caution fee of N20,000 must be deposited before items leave the store and is refunded once items are returned in good condition.',
  },
  {
    title: 'Damages',
    body: 'Damages include:\n• Loss of any item attracts full payment of the worth of the item as at current market price at the time of damage.\n• Tear on the wedding gowns, no caution fee is refunded.\n• Serious mud stains, oil stains, wine stains or other form of serious stains 50% of the caution fee is deducted.',
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
    title: 'Pickup / delivery of rented items',
    body: '• All items are ready for pick-up from 12 noon on Fridays (i.e a day to the wedding day) this is for brides within Owerri and environs.\n• Brides should confirm all items supplied before leaving the show room and afterwards sign off our confirmation form on pickup day as attached behind this policy document.\n• Brides from Orlu, Okigwe, Aba, Umuahia, Anambra, Enugu, Port Harcourt and other states, pick-up/waybill is two days before wedding day.\n• Outside Nigeria delivery is as discussed with the bride.\n• For waybill or delivery both within and outside Owerri, Bride bears the cost of transportation of items both to and fro.\n• Full payments of all items are to be made before pickup or delivery.',
  },
  {
    title: 'Fireworks',
    body: 'Fireworks near the bride are not allowed because they can burn the gown and attract full purchase cost at current market value.',
  },
  {
    title: 'Cancellation of wedding or change of date',
    body: 'This business operates on a NO REFUND POLICY AFTER PAYMENT.\n\nTherefore if for any reason events are cancelled or the wedding date changed, the following applies:\n• Bride: to notify us at least two weeks before the already booked date.\n• No return of items taken out of store.\n• No refund of money already deposited, but the contract will be left open for future purposes.\n• If bride insist on refund a 30% administrative charges will be deducted from total amount deposited and the balance refunded.',
  },
  {
    title: 'Damaged items and value',
    body: 'Return all items in good condition and remember that all rental items are valued using the current market price in case of loss.',
  },
]

const packageOptions = [
  { name: 'Package 1', image: secondImage },
  { name: 'Package 2', image: thirdImage },
  { name: 'Package 3', image: fourthImage },
  { name: 'Package 4', image: fifthImage },
  { name: 'Package 5', image: sixthImage },
  { name: 'Package 6', image: firstImage },
]

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result

      if (typeof result !== 'string') {
        reject(new Error('Unable to read ID card file.'))
        return
      }

      resolve(result)
    }

    reader.onerror = () => reject(new Error('Unable to read ID card file.'))
    reader.readAsDataURL(file)
  })
}

function formatMissingFieldLabel(fieldName: string) {
  const labels: Record<string, string> = {
    brideName: 'Name',
    bridePhone: 'Phone No',
    weddingDate: 'Wedding Date',
    packageName: 'Choose a Package',
    idCardUrl: 'Upload a valid ID card',
    policyAcknowledged: 'Policy acknowledgement',
  }

  return labels[fieldName] || fieldName
}

export default function UserFormPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [submittedForm, setSubmittedForm] = useState<FormState | null>(null)
  const [idCardStatus, setIdCardStatus] = useState<'idle' | 'uploading' | 'error' | 'ready'>('idle')
  const [idCardMessage, setIdCardMessage] = useState('')
  const navigate = useNavigate()
  const selectedPackage = packageOptions.find((item) => item.name === form.packageName) ?? null

  const focusMissingField = (fieldName: string) => {
    const element = document.getElementById(`field-${fieldName}`)
    if (!element) {
      return
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const focusTarget = element.querySelector<HTMLElement>('input, textarea, select, button')
    focusTarget?.focus?.()
  }

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

  const handleIdCardUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      updateField('idCardUrl', '')
      updateField('idCardName', '')
      setIdCardStatus('idle')
      setIdCardMessage('')
      return
    }

    setIdCardStatus('uploading')
    setIdCardMessage('Uploading ID card...')

    try {
      const dataUrl = await fileToDataUrl(file)
      const uploaded = await api.uploads.idCard({
        dataUrl,
        fileName: file.name,
        mimeType: file.type,
      })
      updateField('idCardUrl', uploaded.data.idCardUrl)
      updateField('idCardName', uploaded.data.idCardName)
      setIdCardStatus('ready')
      setIdCardMessage('ID card uploaded successfully.')
    } catch (error) {
      updateField('idCardUrl', '')
      updateField('idCardName', '')
      setIdCardStatus('error')
      setIdCardMessage(error instanceof Error ? error.message : 'Unable to upload ID card.')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('submitting')
    setMessage('')
    setMissingFields([])

    try {
      if (!form.policyAcknowledged) {
        throw new Error('Please check the acknowledgement box before submitting.')
      }

      if (!form.packageName) {
        throw new Error('Please choose a package before submitting.')
      }

      if (!form.idCardUrl) {
        throw new Error('Please upload a valid ID card before submitting.')
      }

      await api.forms.create(form)
      setStatus('success')
      setMessage('Form submitted successfully.')
      setSubmittedForm(form)
      setForm(initialForm)
      setIdCardStatus('idle')
      setIdCardMessage('')
    } catch (error) {
      setStatus('error')
      if (error instanceof Error && 'missingFields' in error) {
        const backendError = error as Error & { missingFields?: string[] }
        const fields = backendError.missingFields ?? []
        setMissingFields(fields)
        setMessage(
          fields.length > 0
            ? `Please complete: ${fields.map(formatMissingFieldLabel).join(', ')}`
            : error.message,
        )
        if (fields.length > 0) {
          window.setTimeout(() => focusMissingField(fields[0]), 50)
        }
        return
      }

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
      `Rental Package Chosen: ${submittedForm.packageName}`,
      `Package Image: ${submittedForm.packageImageUrl}`,
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
      `Policy Acknowledged: ${submittedForm.policyAcknowledged ? 'Yes' : 'No'}`,
      `Valid ID Card: ${submittedForm.idCardName}`,
      `ID Card URL: ${submittedForm.idCardUrl}`,
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
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b58715]">
                Welcome
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-[#1f132d]">Jodella Luxury Bridal </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-full border border-[#d7b35a] bg-white px-5 py-3 text-sm font-semibold text-[#8f6510] transition hover:bg-[#fff8e5]"
            >
              Login 
            </button>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_24px_90px_rgba(72,27,95,0.12)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(161,105,255,0.08),transparent_35%,rgba(255,255,255,0.65))]" />
          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div className="order-2 space-y-6 lg:order-1">
              <div className="space-y-4">
                <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-[#1f132d] sm:text-5xl">
                  Jodella Bridal Rental Policy Form
                </h2>
                <div className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  <h3>Dear Bride To Be,</h3>
                  <p>
                    Thank you for choosing us to be part of your beautiful love story, we are most
                    honored to help create this memory with you.
                  </p>
                  <p>
                    To ensure a seamless rental experience, please take a few moments to carefully
                    read and complete our rental policy form and acknowledge it.
                  </p>
                  <p>
                    Please note that the information provided will help us serve you better. 
                  </p>
                  <p>We look forward to being a part of your forever in love story.</p>

                  <br />
                  <br />

                  <p>With Love from, 
                  
                    <h3>THE JODELLA BRIDAL TEAM</h3></p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative min-h-[420px] overflow-hidden rounded-[1.75rem] border border-[#d7b35a] bg-[#4a3610] text-white shadow-[0_20px_60px_rgba(181,135,21,0.3)] sm:min-h-[540px] lg:min-h-[640px]">
                <video
                  src={heroVideo}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(74,54,16,0.18),rgba(74,54,16,0.22))]" />
                <div className="absolute -right-12 top-8 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-white/15 blur-3xl" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                
                </div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 lg:mt-8">
          {missingFields.length > 0 ? (
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              <p className="font-semibold">Please finish these fields:</p>
              <p className="mt-1">{missingFields.map(formatMissingFieldLabel).join(' • ')}</p>
            </div>
          ) : null}

          <section className="rounded-[2rem] border border-[#e6d4a6] bg-white/90 p-6 shadow-[0_20px_60px_rgba(181,135,21,0.08)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b58715]">
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
              <Field
                label="Name"
                name="brideName"
                value={form.brideName}
                onChange={handleChange}
                highlight={missingFields.includes('brideName')}
                id="field-brideName"
              />
              <Field
                label="Phone No"
                name="bridePhone"
                value={form.bridePhone}
                onChange={handleChange}
                highlight={missingFields.includes('bridePhone')}
                id="field-bridePhone"
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
                highlight={missingFields.includes('weddingDate')}
                id="field-weddingDate"
              />
              <Field
                label="Husband's / Other relations Name"
                name="husbandName"
                value={form.husbandName}
                onChange={handleChange}
              />
              <Field
                label="Husband's/Other relations Phone No"
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
            <article className="rounded-[2rem] border border-[#e6d4a6] bg-white/90 p-6 shadow-[0_20px_60px_rgba(181,135,21,0.08)] sm:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b58715]">
                  Policy copy
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#1f132d]">
                  Terms and Conditions
                </h3>
              </div>

              <div className="mt-6 space-y-4">
                {policyItems.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-[#f3e0a8] bg-[#fffaf0] p-4">
                    <h4 className="text-base font-semibold text-[#27163b]">{item.title}</h4>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-[#e6d4a6] bg-white/90 p-6 shadow-[0_20px_60px_rgba(181,135,21,0.08)] sm:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b58715]">
                  Booking Details
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#1f132d]">Package and approvals</h3>
              </div>

              <div className="mt-6 space-y-6">
                <div
                  id="field-packageName"
                  className={missingFields.includes('packageName') ? 'rounded-[1.75rem] ring-4 ring-amber-100' : ''}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-[#27163b]">Choose a Package</h4>
                    <p className="text-sm text-slate-500">
                      Tap one package image so the client can see the exact option.
                    </p>
                  </div>

                  {selectedPackage ? (
                    <div className="mt-4 rounded-[1.75rem] border border-[#b58715]/30 bg-[#fff9e8] p-4 shadow-[0_18px_40px_rgba(181,135,21,0.12)]">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b58715]">
                            Selected package preview
                          </p>
                          <h5 className="mt-1 text-xl font-semibold text-[#1f132d]">
                            {selectedPackage.name}
                          </h5>
                        </div>
                        <p className="text-sm font-medium text-[#8f6510]">
                          Larger view for easier reading
                        </p>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-[#f3e0a8] bg-white">
                        <div className="flex max-h-[68vh] min-h-[280px] items-center justify-center bg-[#fffdf3] p-4">
                          <img
                            src={selectedPackage.image}
                            alt={selectedPackage.name}
                            className="block max-h-[68vh] w-full object-contain object-center"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[1.75rem] border border-dashed border-[#d8c1ff] bg-[#fcf9ff] p-4 text-sm leading-6 text-slate-600">
                      Select a package below to preview it in a larger, easier-to-read view.
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {packageOptions.map((item) => {
                      const isActive = form.packageName === item.name

                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            updateField('packageName', item.name)
                            updateField('packageImageUrl', item.image)
                          }}
                          className={`overflow-hidden rounded-[1.5rem] border text-left transition ${
                            isActive
                              ? 'border-[#b58715] bg-[#fff4cf] ring-4 ring-[#f0c94d]/35 shadow-[0_22px_50px_rgba(181,135,21,0.26)] scale-[1.01]'
                              : 'border-[#f3e0a8] bg-[#fffaf0] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(181,135,21,0.10)]'
                          }`}
                        >
                          <div className="flex aspect-[4/3] w-full items-center justify-center bg-[#fffdf3] p-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="block h-full w-full object-contain object-center"
                            />
                          </div>
                          <div className="space-y-1 p-4">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b58715]">
                              {item.name}
                            </p>
                            <p className="text-base font-medium text-[#8f6510]">
                              {isActive ? 'Selected package preview' : 'Select this package image'}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {form.packageName ? (
                    <p className="mt-3 text-base font-semibold text-[#8f6510]">
                      Selected package: {form.packageName}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-dashed border-[#d8c1ff] bg-[#fcf9ff] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-[#27163b]">Booking all listed items</h4>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <input
                        type="checkbox"
                        name="packageAllItems"
                        checked={form.packageAllItems}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 text-[#b58715] focus:ring-[#b58715]"
                      />
                      Booking all listed items
                    </label>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    If any item is removed from the package, write it clearly below.
                  </p>

                  {!form.packageAllItems ? (
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
                  ) : (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-slate-600">
                      All listed items are selected. Uncheck this box if any package item is removed.
                    </div>
                  )}

                  <TextAreaField
                    label="Items removed or special package notes"
                    name="removedItems"
                    value={form.removedItems}
                    onChange={handleChange}
                  />
                </div>

                <div
                  id="field-idCardUrl"
                  className={`rounded-2xl border p-4 ${
                    missingFields.includes('idCardUrl')
                      ? 'border-amber-300 bg-amber-50 ring-4 ring-amber-100'
                      : 'border-[#f3e0a8] bg-[#fffaf0]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-[#27163b]">Submit a valid ID card</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Upload a clear image of a valid ID card. 
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p
                        className={`font-medium ${
                          idCardStatus === 'error'
                            ? 'text-rose-600'
                            : idCardStatus === 'uploading'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                        }`}
                      >
                        {idCardMessage || 'Awaiting upload.'}
                      </p>
                    </div>
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Choose file</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIdCardUpload}
                      className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#fff1b8] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#8f6510] hover:file:bg-[#ffe88a]"
                    />
                  </label>

                  {form.idCardUrl ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                      <p className="text-sm font-semibold text-[#27163b]">Uploaded file</p>
                      <p className="mt-1 text-sm text-slate-600">{form.idCardName}</p>
                      <a
                        href={form.idCardUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-sm font-semibold text-[#b58715] underline decoration-[#b58715]/40 underline-offset-4"
                      >
                        View uploaded ID card
                      </a>
                    </div>
                  ) : null}
                </div>
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
                    className="flex items-start gap-3 rounded-2xl border border-[#f3e0a8] bg-[#fffaf0] px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      name={field}
                      checked={form[field as keyof FormState] as boolean}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#b58715] focus:ring-[#b58715]"
                    />
                    <span className="text-sm leading-6 text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-[2rem] border border-[#e6d4a6] bg-[#fffdf4] p-6 shadow-[0_20px_60px_rgba(181,135,21,0.08)] sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b58715]">
                  Contact us
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#1f132d]">Need help or have questions?</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  For further enquiries call or WhatsApp us on <span className="font-semibold text-[#8f6510]">08061666969</span>.
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Thank you for your patronage.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-[#f3e0a8] bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b58715]">
                  Please pay here
                </p>
                <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
                  <div className="rounded-2xl bg-[#fffaf0] px-4 py-3">
                    <p className="font-semibold text-[#1f132d]">Moniepoint</p>
                    <p className="mt-1 text-[#8f6510]">5148419627</p>
                    <p className="mt-1">Jodella Bridals</p>
                  </div>

                  <div className="rounded-2xl bg-[#fffaf0] px-4 py-3">
                    <p className="font-semibold text-[#1f132d]">Zenith Bank</p>
                    <p className="mt-1 text-[#8f6510]">1312024663</p>
                    <p className="mt-1">joedellabridals AND OCCASSIONS</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="field-policyAcknowledged"
            className={`rounded-[2rem] border bg-white/90 p-6 shadow-[0_20px_60px_rgba(181,135,21,0.08)] sm:p-8 ${
              missingFields.includes('policyAcknowledged') ? 'border-amber-300 ring-4 ring-amber-100' : 'border-[#e6d4a6]'
            }`}
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b58715]">
                Acknowledgement
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#1f132d]">
                Confirm you’ve read and accepted the policy
              </h3>
            </div>

            <label className="mt-6 flex items-start gap-3 rounded-2xl border border-[#f3e0a8] bg-[#fffaf0] px-4 py-4">
              <input
                type="checkbox"
                name="policyAcknowledged"
                checked={form.policyAcknowledged}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#b58715] focus:ring-[#b58715]"
              />
              <span className="text-sm leading-6 text-slate-700">
                I acknowledge that I have read, understood, and agreed to all the terms and
                conditions above.
              </span>
            </label>
          </section>

          <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-[#e6d4a6] bg-white/90 p-6 shadow-[0_20px_60px_rgba(181,135,21,0.08)] sm:flex-row sm:items-center sm:p-8">
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
                  className="inline-flex items-center justify-center rounded-full border border-[#d7b35a] bg-white px-6 py-3 text-sm font-semibold text-[#8f6510] shadow-[0_14px_30px_rgba(181,135,21,0.12)] transition hover:bg-[#fff8e5]"
                >
                  Download confirmation
                </button>
              ) : null}

              <button
                type="submit"
                disabled={status === 'submitting' || !form.policyAcknowledged}
                className="inline-flex items-center justify-center rounded-full bg-[#b58715] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(181,135,21,0.28)] transition hover:bg-[#9a6f12] disabled:cursor-not-allowed disabled:opacity-70"
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
  inputRef?: Ref<HTMLInputElement>
  highlight?: boolean
  id?: string
  type?: string
  full?: boolean
}

function Field({
  label,
  name,
  value,
  onChange,
  inputRef,
  highlight,
  id,
  type = 'text',
  full,
}: FieldProps) {
  return (
    <label className={full ? 'md:col-span-2' : ''}>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        ref={inputRef}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#b58715] focus:ring-4 focus:ring-[#b58715]/10 ${
          highlight ? 'border-amber-300 ring-4 ring-amber-100' : 'border-slate-200'
        }`}
      />
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
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#b58715] focus:ring-4 focus:ring-[#b58715]/10"
      />
    </label>
  )
}
