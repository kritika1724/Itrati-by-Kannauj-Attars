import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import AdminAssetImage from '../components/AdminAssetImage'
import { useTaxonomy } from '../components/TaxonomyProvider'
import { getPurposeCollectionMeta } from '../config/collections'
import { fadeUp, revealCard, staggerGrid, viewportOnce } from '../lib/motion'
import { api, auth } from '../services/api'

function Collections() {
  const { purposes, collections, refresh } = useTaxonomy()
  const isAdmin = auth.getUser()?.isAdmin === true
  const [editing, setEditing] = useState({ group: '', id: '', label: '', description: '' })
  const [newPurpose, setNewPurpose] = useState({ label: '', description: '' })
  const [newCollection, setNewCollection] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [busy, setBusy] = useState({ group: '', id: '', type: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const startEditing = (group, term) => {
    setError('')
    setMessage('')
    setEditing({ group, id: term.id, label: term.label, description: term.description || '' })
  }

  const cancelEditing = () => setEditing({ group: '', id: '', label: '', description: '' })

  const saveTerm = async () => {
    const group = editing.group
    const id = editing.id
    const label = String(editing.label || '').trim()
    const description = String(editing.description || '').trim()
    if (!group || !id || !label) {
      setError('Enter a valid name first.')
      return
    }

    try {
      setError('')
      setMessage('')
      setBusy({ group, id, type: 'save' })
      const result = await api.updateTaxonomyTerm(group, id, { label, description })
      await refresh()
      cancelEditing()
      setMessage(result?.message || 'Updated.')
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setBusy({ group: '', id: '', type: '' })
    }
  }

  const deleteTerm = async (group, term) => {
    const confirmed =
      typeof window === 'undefined'
        ? true
        : window.confirm(
            group === 'collection'
              ? `Delete "${term.label}"? This will also remove it from all linked products.`
              : `Delete "${term.label}"? This will also remove this purpose tag from linked products.`
          )
    if (!confirmed) return

    try {
      setError('')
      setMessage('')
      setBusy({ group, id: term.id, type: 'delete' })
      const result = await api.deleteTaxonomyTerm(group, term.id)
      await refresh()
      if (editing.group === group && editing.id === term.id) {
        cancelEditing()
      }
      setMessage(result?.message || 'Deleted.')
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setBusy({ group: '', id: '', type: '' })
    }
  }

  const addTerm = async (group) => {
    const draft = group === 'purpose' ? newPurpose : { label: newCollection, description: newCollectionDescription }
    const label = String(draft.label || '').trim()
    const description = String(draft.description || '').trim()
    if (!label) {
      setError(group === 'purpose' ? 'Enter a purpose collection name first.' : 'Enter a collection name first.')
      return
    }

    try {
      setError('')
      setMessage('')
      setBusy({ group, id: '__new__', type: 'create' })
      const result = await api.createTaxonomyTerm({ group, label, description })
      await refresh()
      if (group === 'purpose') {
        setNewPurpose({ label: '', description: '' })
      } else {
        setNewCollection('')
        setNewCollectionDescription('')
      }
      setMessage(result?.message || (group === 'purpose' ? 'Purpose collection created.' : 'Collection created.'))
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setBusy({ group: '', id: '', type: '' })
    }
  }

  return (
    <div className="ka-page-aura min-h-screen bg-[linear-gradient(180deg,#FFF8EA_0%,#F6F7FB_48%,#EEE3D1_100%)]">
      <header className="px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-12">
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

      <section className="px-4 pb-14 sm:px-6 sm:pb-16">
        <div className="mx-auto w-full max-w-6xl">
          {message ? (
            <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}

          {isAdmin ? (
            <div className="mb-6 rounded-[1.8rem] border border-slate-200/80 bg-white/88 p-4 shadow-[0_18px_50px_rgba(17,27,58,0.08)]">
              <label className="text-sm font-semibold text-ink">Add purpose collection</label>
              <div className="mt-3 grid gap-3 lg:grid-cols-[0.8fr_1.2fr_auto]">
                <input
                  value={newPurpose.label}
                  onChange={(e) => setNewPurpose((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Festive Gifting"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                />
                <input
                  value={newPurpose.description}
                  onChange={(e) => setNewPurpose((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Short card description"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                />
                <button
                  type="button"
                  onClick={() => addTerm('purpose')}
                  disabled={busy.group === 'purpose' && busy.id === '__new__'}
                  className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:bg-emberDark disabled:opacity-60"
                >
                  {busy.group === 'purpose' && busy.id === '__new__' ? 'Adding…' : 'Add'}
                </button>
              </div>
            </div>
          ) : null}

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={staggerGrid(0.08, 0.04)}
            className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
          >
            {purposes.map((purpose) => {
              const meta = getPurposeCollectionMeta(purpose.id, purpose.label, purpose.description)
              const isEditing = editing.group === 'purpose' && editing.id === purpose.id
              const isBusy = busy.group === 'purpose' && busy.id === purpose.id
              return (
                <motion.article
                  key={purpose.id}
                  variants={revealCard}
                  whileHover={{ y: -8 }}
                  className="ka-glow-card flex h-full flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white/88 p-3.5 shadow-[0_24px_60px_rgba(17,27,58,0.10)] backdrop-blur-sm transition duration-300 hover:shadow-[0_30px_70px_rgba(17,27,58,0.14)] sm:rounded-[30px] sm:p-5"
                >
                  <AdminAssetImage
                    assetKey={`explore.purpose.${purpose.id}`}
                    className="ka-frame aspect-square w-full bg-[linear-gradient(135deg,rgba(201,162,74,0.18),rgba(255,255,255,0.96),rgba(17,27,58,0.10))] sm:aspect-[5/4]"
                    imgClassName="p-2"
                    defaultAspect="5 / 4"
                    fit="cover"
                  />

                  <div className="mt-4 flex flex-1 flex-col sm:mt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted sm:text-xs sm:tracking-[0.3em]">
                      Purpose collection
                    </p>
                    {isEditing ? (
                      <div className="mt-3 space-y-3">
                        <input
                          value={editing.label}
                          onChange={(e) => setEditing((prev) => ({ ...prev, label: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                        />
                        <textarea
                          rows="3"
                          value={editing.description}
                          onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Card description"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={saveTerm}
                            disabled={isBusy}
                            className="rounded-full bg-ember px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                          >
                            {isBusy && busy.type === 'save' ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emberDark"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="mt-2 text-base font-semibold leading-snug text-ink sm:mt-3 sm:text-xl">{meta.title}</h2>
                        <p className="mt-2 flex-1 text-[11px] leading-5 text-muted sm:mt-3 sm:text-sm sm:leading-7">{meta.lead}</p>

                        <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                          <Link
                            to={`/collections/purpose/${encodeURIComponent(purpose.id)}`}
                            className="inline-flex w-fit items-center rounded-full border border-gold/25 bg-white px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emberDark transition hover:border-gold/60 hover:bg-clay/60 sm:px-5 sm:text-xs sm:tracking-[0.22em]"
                          >
                            {isAdmin ? 'Manage products' : 'View collection'}
                          </Link>
                          {isAdmin ? (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditing('purpose', purpose)}
                                className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emberDark transition hover:border-gold/60"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTerm('purpose', purpose)}
                                disabled={isBusy && busy.type === 'delete'}
                                className="rounded-full border border-red-200 bg-white px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-600 transition hover:border-red-300 disabled:opacity-60"
                              >
                                {isBusy && busy.type === 'delete' ? 'Deleting…' : 'Delete'}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                </motion.article>
              )
            })}
          </motion.div>

          {collections.length || isAdmin ? (
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={fadeUp}
              className="mt-10 rounded-[30px] border border-gold/20 bg-white/88 p-5 shadow-[0_20px_60px_rgba(17,27,58,0.08)] sm:p-6"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="ka-kicker">Featured collections</p>
                </div>
              </div>

              {isAdmin ? (
                <div className="mt-6 rounded-[1.8rem] border border-slate-200/80 bg-clay/50 p-4">
                  <label className="text-sm font-semibold text-ink">Add collection</label>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[0.8fr_1.2fr_auto]">
                    <input
                      value={newCollection}
                      onChange={(e) => setNewCollection(e.target.value)}
                      placeholder="Self Care"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                    />
                    <input
                      value={newCollectionDescription}
                      onChange={(e) => setNewCollectionDescription(e.target.value)}
                      placeholder="Short card description"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                    />
                    <button
                      type="button"
                      onClick={() => addTerm('collection')}
                      disabled={busy.group === 'collection' && busy.id === '__new__'}
                      className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:bg-emberDark disabled:opacity-60"
                    >
                      {busy.group === 'collection' && busy.id === '__new__' ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                </div>
              ) : null}

              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                variants={staggerGrid(0.08, 0.06)}
                className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
              >
                {collections.map((collection) => {
                  const isEditing = editing.group === 'collection' && editing.id === collection.id
                  const isBusy = busy.group === 'collection' && busy.id === collection.id

                  return (
                  <motion.article
                    key={collection.id}
                    variants={revealCard}
                    whileHover={{ y: -8, scale: 1.01 }}
                    transition={{ duration: 0.28 }}
                    className="ka-glow-card flex h-full flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white/88 p-3.5 shadow-[0_24px_60px_rgba(17,27,58,0.10)] backdrop-blur-sm transition duration-300 hover:shadow-[0_30px_70px_rgba(17,27,58,0.14)] sm:rounded-[30px] sm:p-5"
                  >
                    <AdminAssetImage
                      assetKey={`collections.dynamic.${collection.id}.hero`}
                      className="ka-frame aspect-square w-full bg-[linear-gradient(135deg,rgba(201,162,74,0.18),rgba(255,255,255,0.96),rgba(17,27,58,0.10))] sm:aspect-[5/4]"
                      imgClassName="p-2"
                      defaultAspect="5 / 4"
                      fit="cover"
                    />

                    <div className="mt-4 flex flex-1 flex-col sm:mt-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted sm:text-xs sm:tracking-[0.3em]">
                        Featured collection
                      </p>
                    {isEditing ? (
                        <div className="mt-3 space-y-3">
                          <input
                            value={editing.label}
                            onChange={(e) => setEditing((prev) => ({ ...prev, label: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                          />
                          <textarea
                            rows="3"
                            value={editing.description}
                            onChange={(e) => setEditing((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Card description"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={saveTerm}
                              disabled={isBusy}
                              className="rounded-full bg-ember px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                            >
                              {isBusy && busy.type === 'save' ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emberDark"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className="mt-2 text-base font-semibold leading-snug text-ink sm:mt-3 sm:text-xl">
                            {collection.label}
                          </h2>
                          <p className="mt-2 flex-1 text-[11px] leading-5 text-muted sm:mt-3 sm:text-sm sm:leading-7">
                            {collection.description || 'A handpicked collection designed for easy browsing, discovery, and refined fragrance shopping.'}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                            <Link
                              to={`/collections/${encodeURIComponent(collection.id)}`}
                              className="inline-flex w-fit items-center rounded-full border border-gold/25 bg-white px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emberDark transition hover:border-gold/60 hover:bg-clay/60 sm:px-5 sm:text-xs sm:tracking-[0.22em]"
                            >
                              {isAdmin ? 'Manage products' : 'View collection'}
                            </Link>
                            {isAdmin ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEditing('collection', collection)}
                                  className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emberDark transition hover:border-gold/60"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteTerm('collection', collection)}
                                  disabled={isBusy && busy.type === 'delete'}
                                  className="rounded-full border border-red-200 bg-white px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-600 transition hover:border-red-300 disabled:opacity-60"
                                >
                                  {isBusy && busy.type === 'delete' ? 'Deleting…' : 'Delete'}
                                </button>
                              </>
                            ) : null}
                          </div>
                        </>
                      )}
                    </div>
                  </motion.article>
                  )
                })}
                {!collections.length && isAdmin ? (
                  <motion.div
                    variants={revealCard}
                    className="rounded-[24px] border border-dashed border-slate-300 bg-white/76 p-5 text-sm leading-7 text-muted sm:rounded-[30px]"
                  >
                    Create your first custom collection above, then it will appear here with edit, delete, image upload, and product-management controls.
                  </motion.div>
                ) : null}
              </motion.div>
            </motion.div>
          ) : null}

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
              <motion.div whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Link to="/products" className="ka-btn-primary px-6 py-3">
                  All products
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Collections
