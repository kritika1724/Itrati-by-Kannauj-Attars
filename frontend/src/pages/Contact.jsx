import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import { api, auth } from '../services/api'
import { useLocation } from 'react-router-dom'
import { BUSINESS } from '../config/business'

const schema = yup.object({
  name: yup.string().required('Please enter your name.'),
  email: yup.string().email('Enter a valid email.').required('Email is required.'),
  requiredQuantity: yup.string().default(''),
  message: yup.string().required('Tell us what you are looking for.'),
})

function Contact() {
  const location = useLocation()
  const [user, setUser] = useState(auth.getUser())
  const isAdmin = user?.isAdmin === true
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
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

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setStatus('')
      if (bulkProductIntent && !String(data.requiredQuantity || '').trim()) {
        setError('requiredQuantity', {
          type: 'manual',
          message: 'Please tell us how much you need.',
        })
        setLoading(false)
        return
      }

      clearErrors('requiredQuantity')

      const finalMessage = bulkProductIntent
        ? [
            `Required quantity: ${String(data.requiredQuantity || '').trim()}`,
            '',
            String(data.message || '').trim(),
          ]
            .filter(Boolean)
            .join('\n')
        : data.message

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
          <p className="ka-kicker">Get in touch</p>
          <h1 className="mt-4 ka-h1">
            Talk to us about attars and aromatics.
          </h1>
          <p className="mt-4 ka-lead">
            Reach out for wholesale inquiries, private labeling, custom blends, or gifting options tailored for special occasions.
          </p>
        </div>
      </header>

      <section className="px-6 py-16 bg-sand">
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
                  {(BUSINESS.emails || [BUSINESS.email]).map((email) => (
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
                <p className="text-sm font-semibold text-ink">{BUSINESS.offices.kannauj.label}</p>
                <p className="text-sm text-muted">{BUSINESS.offices.kannauj.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiMapPin className="mt-1 text-ember" size={20} />
              <div>
                <p className="text-sm font-semibold text-ink">{BUSINESS.offices.mumbai.label}</p>
                <p className="text-sm text-muted">{BUSINESS.offices.mumbai.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiPhone className="mt-1 text-ember" size={20} />
              <div>
                <p className="text-sm font-semibold text-ink">Phone</p>
                <div className="mt-1 space-y-1">
                  {(BUSINESS.phones || []).map((phone) => (
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

      <footer className="px-6 text-white bg-midnight py-14">
        <div className="w-full max-w-6xl mx-auto">
          <h2 className="text-2xl font-display">{BUSINESS.fullDisplayName}</h2>
          <p className="mt-2 text-sm text-white/75">
            Mohalla Holi, Kannauj - 209725 (U.P.), India • {BUSINESS.phones?.join(' • ')}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Contact
