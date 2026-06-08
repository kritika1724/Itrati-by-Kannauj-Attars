import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { FiCalendar, FiMail, FiMapPin, FiMessageCircle, FiPhone } from 'react-icons/fi'
import { api, auth } from '../services/api'
import { useLocation } from 'react-router-dom'
import { useContactPageContent, useSiteContactProfile } from '../hooks/useSiteContentBlocks'

const schema = yup.object({
  name: yup.string().required('Please enter your name.'),
  email: yup.string().email('Enter a valid email.').required('Email is required.'),
  phone: yup.string().default(''),
  contactPreference: yup.string().default('message'),
  visitOffice: yup.string().default(''),
  requiredQuantity: yup.string().default(''),
  message: yup.string().required('Tell us what you are looking for.'),
})

const contactPreferenceOptions = [
  {
    value: 'message',
    label: 'Send message',
    description: 'We will reply with details.',
    icon: FiMessageCircle,
  },
  {
    value: 'call',
    label: 'Call me',
    description: 'Share your number for a callback.',
    icon: FiPhone,
  },
  {
    value: 'visit',
    label: 'Visit office',
    description: 'Request a meeting before coming.',
    icon: FiCalendar,
  },
]

const getCleanPhone = (phone) => String(phone || '').replace(/\s+/g, '')

function Contact() {
  const location = useLocation()
  const [user, setUser] = useState(auth.getUser())
  const isAdmin = user?.isAdmin === true
  const contactPageContent = useContactPageContent()
  const contactProfile = useSiteContactProfile()
  const formRef = useRef(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [contactPreference, setContactPreference] = useState('message')
  const [visitOffice, setVisitOffice] = useState('kannauj')
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
    setError,
    clearErrors,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      contactPreference: 'message',
      visitOffice: 'kannauj',
    },
  })

  const bulkProductIntent =
    location?.state?.intent === 'bulk' && Boolean(location?.state?.product?.name)

  useEffect(() => {
    const onAuth = () => setUser(auth.getUser())
    window.addEventListener('authchange', onAuth)
    return () => window.removeEventListener('authchange', onAuth)
  }, [])

  const prefill = useMemo(() => {
    const intent = location?.state?.intent
    if (!intent) return null

    if (intent === 'bulk') {
      const p = location?.state?.product || null
      if (!p?.name) {
        return {
          intent: 'bulk',
          title: 'Bulk / industrial',
          description:
            'Tell us what you need and we will share pricing, availability, lead time, and shipping details.',
          message:
            'Hi, I want a bulk/industrial inquiry.\n\nPlease share bulk pricing, availability, lead time, and shipping details.',
        }
      }

      const lines = [
        `Hi, I want a bulk/industrial inquiry for: ${p.name}.`,
        '',
        'Please share bulk pricing, availability, lead time, and shipping details.',
      ].filter(Boolean)

      return {
        intent: 'bulk',
        title: 'Bulk / industrial',
        description:
          'The form is pre-filled with the product context. Add your required quantity, name, and email, then send.',
        message: lines.join('\n'),
      }
    }

    if (intent === 'blend') {
      const blend = location?.state?.blend || null
      const base = blend?.base ? `Base: ${blend.base}` : ''
      const middle = blend?.middle ? `Middle: ${blend.middle}` : ''
      const top = blend?.top ? `Top: ${blend.top}` : ''
      const families =
        Array.isArray(blend?.families) && blend.families.length
          ? `Families: ${blend.families.join(', ')}`
          : ''

      const lines = [
        'Hi, I want a custom attar blend.',
        [base, middle, top, families].filter(Boolean).join(' • '),
        '',
        'Please share next steps for sampling, pricing, lead time, and delivery.',
      ].filter(Boolean)

      return {
        intent: 'blend',
        title: 'Custom blend',
        description:
          'Share your preferred notes and quantity. We will guide you with sampling, pricing, and lead time.',
        message: lines.join('\n'),
      }
    }

    if (intent === 'quiz') {
      const quiz = location?.state?.quiz || null
      const fam =
        Array.isArray(quiz?.families) && quiz.families.length ? `Families: ${quiz.families.join(', ')}` : ''
      const purpose = quiz?.purpose ? `Purpose: ${quiz.purpose}` : ''
      const lines = [
        'Hi, I need help selecting the right attar/perfume profile.',
        [fam, purpose].filter(Boolean).join(' • '),
        '',
        'Please recommend a few options and advise on pack sizes and pricing.',
      ].filter(Boolean)

      return {
        intent: 'quiz',
        title: 'Discovery quiz',
        description:
          'We will suggest a few options based on your preferences and use case.',
        message: lines.join('\n'),
      }
    }

    return null
  }, [location?.state])

  useEffect(() => {
    // Prefill name/email:
    // - If logged-in: use account details.
    // - Else: remember last-used details locally (so users don't retype).
    const currentName = (getValues('name') || '').trim()
    const currentEmail = (getValues('email') || '').trim()

    if (user?.name && !currentName) setValue('name', user.name)
    if (user?.email && !currentEmail) setValue('email', user.email)

    if (!user && (!currentName || !currentEmail)) {
      try {
        const remembered = JSON.parse(localStorage.getItem('contact:v1') || 'null')
        if (remembered && typeof remembered === 'object') {
          if (!currentName && remembered.name) setValue('name', String(remembered.name))
          if (!currentEmail && remembered.email) setValue('email', String(remembered.email))
          if (remembered.phone) setValue('phone', String(remembered.phone))
        }
      } catch {
        // ignore
      }
    }

    // Intent prefill: message only (don't wipe name/email).
    if (prefill?.message) {
      const currentMsg = (getValues('message') || '').trim()
      if (!currentMsg) setValue('message', prefill.message)
    }
  }, [prefill?.message, user, setValue, getValues])

  const applyContactIntent = (preference) => {
    setContactPreference(preference)
    setValue('contactPreference', preference)

    const currentMsg = String(getValues('message') || '').trim()
    if (!currentMsg) {
      if (preference === 'call') {
        setValue('message', 'Hi, I would like to talk on call about my fragrance requirement.')
      } else if (preference === 'visit') {
        setValue('message', 'Hi, I would like to visit your office. Please call me to confirm a suitable time.')
      }
    }

    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setStatus('')
      const selectedPreference = String(data.contactPreference || contactPreference || 'message')
      const selectedPhone = String(data.phone || '').trim()
      const selectedOfficeKey = String(data.visitOffice || visitOffice || 'kannauj')
      const selectedOffice = contactProfile.offices?.[selectedOfficeKey]

      if ((selectedPreference === 'call' || selectedPreference === 'visit') && !selectedPhone) {
        setError('phone', {
          type: 'manual',
          message: 'Please share your phone number so we can call you.',
        })
        setLoading(false)
        return
      }

      if (bulkProductIntent && !String(data.requiredQuantity || '').trim()) {
        setError('requiredQuantity', {
          type: 'manual',
          message: 'Please tell us how much you need.',
        })
        setLoading(false)
        return
      }

      clearErrors('requiredQuantity')
      clearErrors('phone')

      const preferenceLabel =
        selectedPreference === 'visit'
          ? 'Wants to visit office'
          : selectedPreference === 'call'
            ? 'Wants a phone call'
            : 'Message inquiry'

      const finalMessage = [
        `Contact preference: ${preferenceLabel}`,
        selectedPhone ? `Phone: ${selectedPhone}` : '',
        selectedPreference === 'visit' && selectedOffice
          ? `Preferred office: ${selectedOffice.label} - ${selectedOffice.address}`
          : '',
        bulkProductIntent ? `Required quantity: ${String(data.requiredQuantity || '').trim()}` : '',
        '',
        String(data.message || '').trim(),
      ]
        .filter(Boolean)
        .join('\n')

      await api.submitContact({
        ...data,
        message: finalMessage,
      })
      setSubmitted(true)
      try {
        localStorage.setItem(
          'contact:v1',
          JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone,
          })
        )
      } catch {
        // ignore
      }
      reset()
      setStatus('Thanks! We received your message and will reply soon.')
      setTimeout(() => setSubmitted(false), 4000)
    } catch (e) {
      setStatus(e.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen px-6 py-16 bg-sand">
        <div className="w-full max-w-2xl p-8 mx-auto bg-white border shadow-lg rounded-3xl border-slate-200/80 shadow-black/10">
          <p className="text-xs uppercase tracking-[0.35em] text-muted">Admin</p>
          <h1 className="mt-4 text-3xl font-display text-ink">Contact Inbox</h1>
          <p className="mt-3 text-sm text-muted">
            Admins don’t need the public contact form. Review customer inquiries in the inbox.
          </p>
          <a
            href="/admin/contacts"
            className="inline-flex px-6 py-3 mt-6 text-sm font-semibold text-white rounded-full bg-ember"
          >
            View contact requests →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-sand">
      <header className="px-6 pt-12 pb-12">
        <div className="w-full max-w-6xl mx-auto">
          <p className="ka-kicker">{contactPageContent.heroKicker}</p>
          <h1 className="mt-4 ka-h1">
            {contactPageContent.heroTitle}
          </h1>
          <p className="mt-4 ka-lead">
            {contactPageContent.heroDescription}
          </p>
        </div>
      </header>

      <section className="px-6 py-16 bg-sand">
        <div className="mx-auto mb-10 grid w-full max-w-6xl gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/15 text-emberDark">
                <FiPhone size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Call before ordering</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Talk directly for product selection, bulk pricing, or visit timing.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {contactProfile.phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${getCleanPhone(phone)}`}
                      className="ka-btn-primary px-4 py-2 text-xs"
                    >
                      Call {phone}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/15 text-emberDark">
                <FiMapPin size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Come and meet us</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Choose a preferred office and we will confirm a suitable meeting time.
                </p>
                <button
                  type="button"
                  onClick={() => applyContactIntent('visit')}
                  className="ka-btn-ghost mt-4 px-4 py-2 text-xs"
                >
                  Request a visit
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {prefill ? (
            <div className="lg:col-span-2">
              <div className="p-6 border shadow-sm rounded-3xl border-gold/25 bg-clay/60">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted">
                  {prefill?.title || 'Inquiry'}
                </p>
                <p className="mt-2 text-sm text-ink">{prefill?.description || ''}</p>
              </div>
            </div>
          ) : null}
          <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)}
            className="p-8 border shadow-sm rounded-3xl border-slate-200/80 bg-clay/70"
          >
            <div className="grid gap-5">
              <div>
                <label className="text-sm font-semibold text-ink">Name</label>
                <input
                  {...register('name')}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 mt-2 text-sm bg-white border rounded-xl border-slate-200 text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                />
                {errors.name && <p className="mt-2 text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Email</label>
                <input
                  {...register('email')}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 mt-2 text-sm bg-white border rounded-xl border-slate-200 text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                />
                {errors.email && <p className="mt-2 text-xs text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Phone / WhatsApp</label>
                <input
                  {...register('phone')}
                  placeholder="+91..."
                  className="w-full px-4 py-3 mt-2 text-sm bg-white border rounded-xl border-slate-200 text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                />
                {errors.phone && <p className="mt-2 text-xs text-red-600">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">How should we connect?</label>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {contactPreferenceOptions.map((option) => {
                    const Icon = option.icon
                    const active = contactPreference === option.value
                    return (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded-2xl border p-4 transition ${
                          active
                            ? 'border-gold/45 bg-white shadow-[0_18px_45px_rgba(201,162,74,0.14)]'
                            : 'border-slate-200 bg-white/70 hover:border-gold/35'
                        }`}
                      >
                        <input
                          type="radio"
                          value={option.value}
                          {...register('contactPreference')}
                          checked={active}
                          onChange={() => applyContactIntent(option.value)}
                          className="sr-only"
                        />
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/15 text-emberDark">
                          <Icon size={16} />
                        </span>
                        <span className="mt-3 block text-sm font-semibold text-ink">{option.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-muted">{option.description}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              {contactPreference === 'visit' ? (
                <div>
                  <label className="text-sm font-semibold text-ink">Preferred office</label>
                  <select
                    {...register('visitOffice')}
                    value={visitOffice}
                    onChange={(e) => {
                      setVisitOffice(e.target.value)
                      setValue('visitOffice', e.target.value)
                    }}
                    className="w-full px-4 py-3 mt-2 text-sm bg-white border rounded-xl border-slate-200 text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                  >
                    <option value="kannauj">{contactProfile.offices.kannauj.label}</option>
                    <option value="mumbai">{contactProfile.offices.mumbai.label}</option>
                  </select>
                </div>
              ) : null}
              {bulkProductIntent ? (
                <div>
                  <label className="text-sm font-semibold text-ink">How much do you need?</label>
                  <input
                    {...register('requiredQuantity')}
                    placeholder="Example: 5 kg, 25 bottles, 10 litres"
                    className="w-full px-4 py-3 mt-2 text-sm bg-white border rounded-xl border-slate-200 text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                  />
                  <p className="mt-2 text-xs text-muted">
                    Mention the quantity or requirement you want us to quote for.
                  </p>
                  {errors.requiredQuantity && (
                    <p className="mt-2 text-xs text-red-600">{errors.requiredQuantity.message}</p>
                  )}
                </div>
              ) : null}
              <div>
                <label className="text-sm font-semibold text-ink">Message</label>
                <textarea
                  {...register('message')}
                  rows="5"
                  placeholder="Tell us about your requirement"
                  className="w-full px-4 py-3 mt-2 text-sm bg-white border rounded-xl border-slate-200 text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                />
                {errors.message && <p className="mt-2 text-xs text-red-600">{errors.message.message}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="ka-btn-primary w-fit"
              >
                {loading ? 'Sending…' : 'Send inquiry'}
              </button>
              {status && (
                <p className={`text-sm font-semibold ${submitted ? 'text-emberDark' : 'text-red-600'}`}>
                  {status}
                </p>
              )}
            </div>
          </form>

          <div className="p-8 space-y-6 bg-white border shadow-lg rounded-3xl border-slate-200/80 shadow-black/10">
            <div className="flex items-start gap-3">
              <FiMail className="mt-1 text-ember" size={20} />
              <div>
                <p className="text-sm font-semibold text-ink">Email</p>
                <div className="mt-1 space-y-1">
                  {contactProfile.emails.map((email) => (
                    <a key={email} href={`mailto:${email}`} className="block text-sm text-muted hover:text-ink">
                      {email}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiMapPin className="mt-1 text-ember" size={20} />
              <div>
                <p className="text-sm font-semibold text-ink">{contactProfile.offices.kannauj.label}</p>
                <p className="text-sm text-muted">{contactProfile.offices.kannauj.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiMapPin className="mt-1 text-ember" size={20} />
              <div>
                <p className="text-sm font-semibold text-ink">{contactProfile.offices.mumbai.label}</p>
                <p className="text-sm text-muted">{contactProfile.offices.mumbai.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiPhone className="mt-1 text-ember" size={20} />
              <div>
                <p className="text-sm font-semibold text-ink">Phone</p>
                <div className="mt-1 space-y-1">
                  {contactProfile.phones.map((phone) => (
                    <a key={phone} href={`tel:${phone.replace(/\s+/g, '')}`} className="block text-sm text-muted hover:text-ink">
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
