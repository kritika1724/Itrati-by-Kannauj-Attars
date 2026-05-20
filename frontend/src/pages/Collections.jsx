import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import AdminAssetImage from '../components/AdminAssetImage'
import { useTaxonomy } from '../components/TaxonomyProvider'
import { getPurposeCollectionMeta } from '../config/collections'
import { fadeUp, revealCard, staggerGrid, viewportOnce } from '../lib/motion'
import { auth } from '../services/api'

function Collections() {
  const { purposes } = useTaxonomy()
  const isAdmin = auth.getUser()?.isAdmin === true

  return (
    <div className="ka-page-aura min-h-screen bg-[linear-gradient(180deg,#FFF8EA_0%,#F6F7FB_48%,#EEE3D1_100%)]">
      <header className="px-6 pb-10 pt-12">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mx-auto w-full max-w-6xl"
        >
          <p className="ka-kicker">Collections</p>
          <h1 className="mt-4 ka-h1">Browse by purpose</h1>
          <p className="mt-4 max-w-3xl ka-lead">
            Choose the kind of fragrance journey you are shopping for, then explore all products that belong to that collection.
          </p>
        </motion.div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={staggerGrid(0.08, 0.04)}
            className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
          >
            {purposes.map((purpose) => {
              const meta = getPurposeCollectionMeta(purpose.id, purpose.label)
              return (
                <motion.article
                  key={purpose.id}
                  variants={revealCard}
                  whileHover={{ y: -8 }}
                  className="ka-glow-card flex h-full flex-col overflow-hidden rounded-[30px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_60px_rgba(17,27,58,0.10)] backdrop-blur-sm transition duration-300 hover:shadow-[0_30px_70px_rgba(17,27,58,0.14)]"
                >
                  <AdminAssetImage
                    assetKey={`explore.purpose.${purpose.id}`}
                    className="ka-frame aspect-[5/4] w-full bg-[linear-gradient(135deg,rgba(201,162,74,0.18),rgba(255,255,255,0.96),rgba(17,27,58,0.10))]"
                    imgClassName="p-2"
                    defaultAspect="5 / 4"
                    fit="cover"
                  />

                  <div className="mt-5 flex flex-1 flex-col">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Purpose collection</p>
                    <h2 className="mt-3 text-xl font-semibold text-ink">{meta.title}</h2>
                    <p className="mt-3 flex-1 text-sm leading-7 text-muted">{meta.lead}</p>

                    <Link
                      to={`/collections/purpose/${encodeURIComponent(purpose.id)}`}
                      className="mt-5 inline-flex w-fit items-center rounded-full border border-gold/25 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emberDark transition hover:border-gold/60 hover:bg-clay/60"
                    >
                      {isAdmin ? 'Manage collection' : 'View collection'}
                    </Link>
                  </div>
                </motion.article>
              )
            })}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={fadeUp}
            className="mt-10 rounded-[30px] border border-gold/20 bg-white/88 p-6 shadow-[0_20px_60px_rgba(17,27,58,0.08)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="ka-kicker">Need everything in one place?</p>
                <h2 className="mt-3 text-2xl font-semibold text-ink">View the complete product range</h2>
              </div>
              <Link to="/products" className="ka-btn-primary px-6 py-3">
                All products
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Collections
