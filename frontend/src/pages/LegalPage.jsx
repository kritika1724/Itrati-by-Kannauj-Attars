import { Link, useLocation } from 'react-router-dom'
import { useLegalPageContent } from '../hooks/useSiteContentBlocks'

function LegalPage() {
  const { pathname } = useLocation()
  const page = useLegalPageContent(pathname)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F2EA_52%,#FFFDF8_100%)] px-4 pb-16 pt-8 text-[#19213C] sm:px-6 lg:px-8 lg:pt-10">
      <div className="mx-auto w-full max-w-5xl">
        <Link to="/" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8D7667] transition hover:text-[#C9A24A]">
          ← Back to home
        </Link>

        <section className="mt-6 rounded-[2rem] border border-[rgba(25,33,60,0.08)] bg-white/90 p-6 shadow-[0_22px_60px_rgba(25,33,60,0.07)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Policy</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#19213C] sm:text-4xl">{page.title}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-[#5F6475] sm:text-base">{page.intro}</p>

          <div className="mt-8 space-y-6">
            {page.sections.map((section) => (
              <article
                key={section.title}
                className="rounded-[1.5rem] border border-[rgba(25,33,60,0.08)] bg-[rgba(252,249,243,0.92)] p-5"
              >
                <h2 className="text-lg font-semibold text-[#19213C]">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#5F6475] sm:text-base sm:leading-8">{section.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-gold/15 bg-[linear-gradient(135deg,rgba(247,238,226,0.94),rgba(255,255,255,0.86))] p-5">
            <p className="text-sm leading-7 text-[#5F6475]">
              Need help with an order or policy question? Visit <Link to="/contact" className="font-semibold text-[#19213C] hover:text-[#C9A24A]">Contact</Link> and the team will assist you.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LegalPage
