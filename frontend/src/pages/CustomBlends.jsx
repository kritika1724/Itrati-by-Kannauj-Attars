import { Link } from 'react-router-dom'
import AdminAssetImage from '../components/AdminAssetImage'
import { BUSINESS } from '../config/business'

function CustomBlends() {
  return (
    <div className="bg-sand">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs uppercase tracking-[0.35em] text-muted">Services</p>
          <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">Custom Blends</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Create a signature attar for your brand, gifting, or special occasions. We’ll help you
            shape a scent direction and deliver a refined blend.
          </p>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
	          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
              <AdminAssetImage
                assetKey="customblends.hero"
                className="aspect-[16/9] w-full rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,rgba(201,162,74,0.20),rgba(255,246,236,0.96),rgba(17,27,58,0.10))]"
                imgClassName="p-2"
                defaultAspect="16 / 9"
                fit="contain"
              />

            <h2 className="mt-6 text-lg font-semibold text-ink">How it works</h2>
            <ol className="mt-3 space-y-2 text-sm text-muted">
              <li>1. Share your idea (notes, mood, budget, quantity)</li>
              <li>2. We propose a direction and sample options</li>
              <li>3. Finalize the blend and packaging</li>
              <li>4. Production and delivery</li>
            </ol>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-clay/70 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Best for</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
                <p className="text-sm font-semibold text-ink">Private label</p>
                <p className="mt-2 text-sm text-muted">Your own scent identity (placeholder)</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
                <p className="text-sm font-semibold text-ink">Gifting</p>
                <p className="mt-2 text-sm text-muted">Weddings, events, premium hampers (placeholder)</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
                <p className="text-sm font-semibold text-ink">Bulk supply</p>
                <p className="mt-2 text-sm text-muted">Retailers and distributors (placeholder)</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/create-blend"
                className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emberDark"
              >
                Create your blend
              </Link>
              <Link
                to="/contact"
                className="rounded-full border border-gold/25 bg-white px-5 py-2 text-sm font-semibold text-ink"
              >
                Request custom blend
              </Link>
              <Link
                to="/products"
                className="rounded-full border border-gold/25 bg-white px-5 py-2 text-sm font-semibold text-ink"
              >
                Browse ready products
              </Link>
              <Link
                to="/discovery-quiz"
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emberDark"
              >
                Take discovery quiz
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-midnight px-6 py-14 text-white">
        <div className="mx-auto w-full max-w-6xl">
          <h2 className="font-display text-2xl">{BUSINESS.fullDisplayName}</h2>
          <p className="mt-2 text-sm text-white/75">Custom blends with craft and consistency.</p>
        </div>
      </footer>
    </div>
  )
}

export default CustomBlends
