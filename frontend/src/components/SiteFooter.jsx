import { Link } from 'react-router-dom'
import { FiMail, FiPhone } from 'react-icons/fi'
import LogoMark from './LogoMark'
import BrandWordmark from './BrandWordmark'
import { BUSINESS } from '../config/business'
import { useSiteContactProfile } from '../hooks/useSiteContentBlocks'

const importantLinks = [
  { label: 'Contact', to: '/contact' },
  { label: 'Terms of Service', to: '/terms-of-service' },
  { label: 'Refund Policy', to: '/refund-policy' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Shipping Policy', to: '/shipping-policy' },
]

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/products' },
  { label: 'Our Story', to: '/#our-story' },
]

function SiteFooter() {
  const contactProfile = useSiteContactProfile()

  return (
    <footer className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-7xl rounded-[2.2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,252,247,0.94),rgba(243,233,219,0.92))] p-6 shadow-[0_24px_80px_rgba(28,19,13,0.06)] sm:rounded-[2.4rem] sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.8fr_0.8fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3" aria-label={`Go to ${BUSINESS.brandName} home`}>
              <LogoMark className="h-14 w-14" />
              <div className="min-w-0">
                <BrandWordmark className="max-w-[12rem]" />
                <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-muted sm:text-xs sm:tracking-[0.3em]">
                  {BUSINESS.endorsement} • Since {BUSINESS.since}
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-xl text-sm leading-8 text-muted sm:text-base">
              Crafted in Kannauj, refined for modern buyers, and guided by a thousand-year fragrance tradition that still feels intimate today.
            </p>

            <div className="mt-6 space-y-3 text-sm font-semibold text-ruby">
              <a href={`mailto:${contactProfile.emails[0]}`} className="flex items-center gap-3 transition hover:text-ink">
                <FiMail size={18} />
                {contactProfile.emails[0]}
              </a>
              {contactProfile.phones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-3 transition hover:text-ink"
                >
                  <FiPhone size={18} />
                  {phone}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Important Links</p>
            <div className="mt-5 space-y-3">
              {importantLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="block text-sm font-semibold text-ink transition hover:text-[#C9A24A]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Quick Links</p>
            <div className="mt-5 space-y-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="block text-sm font-semibold text-ink transition hover:text-[#C9A24A]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[rgba(25,33,60,0.08)] pt-5 text-xs text-muted sm:flex sm:items-center sm:justify-between">
          <p>{contactProfile.offices.kannauj.address}</p>
          <p className="mt-2 sm:mt-0">© {new Date().getFullYear()} {BUSINESS.fullDisplayName}</p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
