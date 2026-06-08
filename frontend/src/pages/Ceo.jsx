import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiAward, FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import AdminAssetImage from '../components/AdminAssetImage'
import AdminAssetMediaGrid from '../components/AdminAssetMediaGrid'
import { BUSINESS } from '../config/business'
import { useSiteContactProfile } from '../hooks/useSiteContentBlocks'

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
}

function ContactBlock({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/70 bg-white/78 p-4 shadow-[0_18px_50px_rgba(28,19,13,0.06)]">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/15 text-emberDark">
          <Icon size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">{label}</p>
          <div className="mt-2 space-y-1 text-sm font-semibold text-ink">{children}</div>
        </div>
      </div>
    </div>
  )
}

function OfficeBlock({ office }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/82 p-5 shadow-[0_18px_50px_rgba(28,19,13,0.06)]">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/15 text-emberDark">
          <FiMapPin size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{office.label}</p>
          <p className="mt-2 text-sm leading-7 text-muted">{office.address}</p>
        </div>
      </div>
    </div>
  )
}

function Ceo() {
  const contactProfile = useSiteContactProfile()

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#F8F1E7_0%,#FFFDFC_48%,#F3E9DB_100%)] text-ink">
      <header className="px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.55 }}
            className="min-w-0 overflow-hidden rounded-[2rem] border border-white/75 bg-white/78 p-3 shadow-[0_28px_90px_rgba(28,19,13,0.08)] sm:rounded-[2.4rem] sm:p-4"
          >
            <AdminAssetImage
              assetKey="about.ceo.photo"
              className="aspect-[4/5] w-full rounded-[1.55rem] border border-gold/18 bg-white sm:rounded-[2rem]"
              imgClassName="p-2 sm:p-3"
              defaultAspect="4 / 5"
              fit="contain"
            />
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="min-w-0"
          >
            <p className="ka-kicker">Know About CEO</p>
            <h1 className="mt-4 font-display text-4xl leading-[0.95] text-ink sm:text-5xl md:text-6xl">
              {BUSINESS.founder}
            </h1>
            <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-emberDark sm:text-lg sm:leading-8">
              {BUSINESS.founderTitle}
            </p>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-muted sm:text-base sm:leading-8">
              {BUSINESS.displayName} is guided by a founder-led approach: heritage craft, consistent quality,
              reliable supply, and a clear respect for Kannauj's perfume tradition.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <ContactBlock icon={FiAward} label="Leadership">
                <p className="leading-6">Founder, {BUSINESS.firmName}</p>
              </ContactBlock>
              <ContactBlock icon={FiAward} label="Association">
                <p className="leading-6">President, The Attars & Perfumers Association Kannauj</p>
              </ContactBlock>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/products" className="ka-btn-primary px-6 py-3">
                Browse products
              </Link>
              <Link to="/contact" className="ka-btn-ghost px-6 py-3">
                Contact
              </Link>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <section className="min-w-0 rounded-[2rem] border border-white/75 bg-white/72 p-5 shadow-[0_24px_80px_rgba(28,19,13,0.06)] sm:p-8">
            <p className="ka-kicker">Profile</p>
            <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">About the founder</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-muted sm:text-base sm:leading-8">
              <p>
                Founded in 1998, Kannauj Attars is a private enterprise based in Kannauj, widely recognized as
                India's perfume heritage city. {BUSINESS.displayName} is its newer brand expression, introduced in
                2026 for a more contemporary luxury identity.
              </p>
              <p>
                Under the leadership of Mr. Pawan Trivedi, the focus remains on thoughtful blending, dependable
                sourcing, clear communication, and a polished finish for both retail buyers and trade partners.
              </p>
              <p>
                The business deals in aromatic chemicals, Indian attars, and specialty fragrance compounds,
                supporting personal use, gifting, and bulk requirements.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/collections" className="ka-btn-ghost px-5 py-2.5">
                Collections
              </Link>
              <Link to="/" className="ka-btn-ghost px-5 py-2.5">
                Back to Home
              </Link>
            </div>
          </section>

          <aside className="grid min-w-0 gap-6">
            <section className="rounded-[2rem] border border-white/75 bg-white/72 p-5 shadow-[0_24px_80px_rgba(28,19,13,0.06)] sm:p-8">
              <p className="ka-kicker">Contact</p>
              <div className="mt-5 grid gap-3">
                <ContactBlock icon={FiMail} label="Email">
                  {contactProfile.emails.map((email) => (
                    <a key={email} href={`mailto:${email}`} className="block min-w-0 truncate hover:text-emberDark">
                      {email}
                    </a>
                  ))}
                </ContactBlock>
                <ContactBlock icon={FiPhone} label="Mobile">
                  {contactProfile.phones.map((phone) => (
                    <a key={phone} href={`tel:${phone.replace(/\s+/g, '')}`} className="block hover:text-emberDark">
                      {phone}
                    </a>
                  ))}
                </ContactBlock>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/75 bg-white/72 p-5 shadow-[0_24px_80px_rgba(28,19,13,0.06)] sm:p-8">
              <p className="ka-kicker">Offices</p>
              <div className="mt-5 grid gap-3">
                <OfficeBlock office={contactProfile.offices.kannauj} />
                <OfficeBlock office={contactProfile.offices.mumbai} />
              </div>
            </section>
          </aside>

          <AdminAssetMediaGrid
            title="CEO photos"
            prefix="about.ceo.extra."
            description="Admin can add unlimited founder/CEO photos here for the public CEO section."
            eyebrow="Founder gallery"
            aspect="4 / 5"
            gridClassName="sm:grid-cols-2 lg:grid-cols-4"
            className="lg:col-span-2 rounded-[2rem] border border-white/75 bg-white/72 p-5 shadow-[0_24px_80px_rgba(28,19,13,0.06)] sm:p-8"
          />
        </div>
      </main>
    </div>
  )
}

export default Ceo
