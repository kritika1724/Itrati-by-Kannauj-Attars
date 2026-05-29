import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiMail, FiMapPin, FiPhone, FiAward } from 'react-icons/fi'
import AdminAssetImage from '../components/AdminAssetImage'
import { BUSINESS } from '../config/business'
import { useSiteContactProfile } from '../hooks/useSiteContentBlocks'

function Ceo() {
  const contactProfile = useSiteContactProfile()

  return (
    <div className="bg-sand min-h-screen">
      <header className="px-6 pb-12 pt-12">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <p className="ka-kicker">Leadership</p>
            <h1 className="mt-4 ka-h1">{BUSINESS.founder}</h1>
            <p className="mt-4 ka-lead">
              {BUSINESS.founderTitle}
            </p>
            <p className="mt-6 text-sm text-muted">
              {BUSINESS.displayName} is built on heritage craft and modern reliability — serving personal buyers as well as trade
              and bulk requirements with a consistent focus on purity and finish.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="ka-btn-primary px-6 py-3">
                Browse products
              </Link>
              <Link to="/contact" className="ka-btn-ghost px-6 py-3">
                Contact
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10"
          >
            <AdminAssetImage
              assetKey="about.ceo.photo"
              className="ka-frame ka-mediaBg aspect-[4/5] w-full"
              imgClassName="p-3"
              defaultAspect="4 / 5"
              fit="contain"
            />
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-clay/60 p-4">
                <div className="flex items-start gap-3">
                  <FiAward className="mt-0.5 text-ember" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-ink">Role</p>
                    <p className="mt-1 text-sm text-muted">
                      {BUSINESS.founderTitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-clay/60 p-4">
                <div className="flex items-start gap-3">
                  <FiMail className="mt-0.5 text-ember" size={18} />
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
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-clay/60 p-4">
                <div className="flex items-start gap-3">
                  <FiPhone className="mt-0.5 text-ember" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-ink">Mobile</p>
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
          </motion.div>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-black/10">
            <h2 className="text-xl font-semibold text-ink">About</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Founded in 1998, Kannauj Attars is a private enterprise based in Kannauj — widely recognized as India’s
              perfume heritage city. {BUSINESS.displayName} is its newer brand expression, introduced in 2026. Under the
              leadership of Mr. Pawan Trivedi, who also serves as President of The Attars & Perfumers Association Kannauj,
              the focus remains on consistent quality, thoughtful blending, and reliable supply.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The business deals in aromatics chemicals, as well as Pan Masala and Zafrani Jarda compounds, supporting
              both everyday buyers and trade partners.
            </p>

            <div className="mt-8 rounded-2xl border border-gold/25 bg-clay/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted">Quick links</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/products" className="ka-btn-primary px-5 py-2">
                  Products
                </Link>
                <Link to="/collections" className="ka-btn-ghost px-5 py-2">
                  Collections
                </Link>
                <Link to="/contact" className="ka-btn-ghost px-5 py-2">
                  Contact
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-black/10">
            <h2 className="text-xl font-semibold text-ink">Offices</h2>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-slate-200/80 bg-clay/60 p-5">
                <div className="flex items-start gap-3">
                  <FiMapPin className="mt-0.5 text-ember" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-ink">{contactProfile.offices.kannauj.label}</p>
                    <p className="mt-2 text-sm text-muted">{contactProfile.offices.kannauj.address}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-clay/60 p-5">
                <div className="flex items-start gap-3">
                  <FiMapPin className="mt-0.5 text-ember" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-ink">{contactProfile.offices.mumbai.label}</p>
                    <p className="mt-2 text-sm text-muted">
                      {contactProfile.offices.mumbai.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link to="/" className="mt-6 inline-flex text-sm font-semibold text-emberDark hover:text-ink">
              Back to Home →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Ceo
