import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { api } from '../services/api'
import { useTaxonomy } from '../components/TaxonomyProvider'

const FILTER_GROUPS = [
  {
    id: 'purpose',
    title: 'Shop by purpose',
    description: 'Add new browse filters like gifting, rituals, wellness, or trade-specific uses.',
  },
  {
    id: 'family',
    title: 'Fragrance family',
    description: 'Add new scent families whenever your catalog grows into new profiles.',
  },
  {
    id: 'season',
    title: 'Season',
    description: 'Add seasonal browse filters like Summer, Winter, Monsoon, or campaign-specific weather edits.',
  },
  {
    id: 'gender',
    title: 'Gender',
    description: 'Add Men, Women, Unisex, or any custom audience-focused fragrance filter.',
  },
  {
    id: 'collection',
    title: 'Collections',
    description: 'Add, edit, delete, and manage custom collections.',
  },
]

function AdminFilters() {
  const { purposes, families, seasons, genders, collections, refresh, loading } = useTaxonomy()
  const [drafts, setDrafts] = useState({ purpose: '', family: '', season: '', gender: '', collection: '' })
  const [savingGroup, setSavingGroup] = useState('')
  const [editing, setEditing] = useState({ group: '', id: '', label: '' })
  const [busyAction, setBusyAction] = useState({ group: '', id: '', type: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const termsByGroup = useMemo(
    () => ({
      purpose: purposes,
      family: families,
      season: seasons,
      gender: genders,
      collection: collections,
    }),
    [purposes, families, seasons, genders, collections]
  )

  const createFilter = async (group) => {
    const label = String(drafts[group] || '').trim()
    if (!label) {
      setError('Enter a filter name first.')
      return
    }

    try {
      setError('')
      setMessage('')
      setSavingGroup(group)
      const result = await api.createTaxonomyTerm({ group, label })
      await refresh()
      setDrafts((prev) => ({ ...prev, [group]: '' }))
      setMessage(
        result?.message || (group === 'collection' ? 'Collection saved.' : 'Filter saved.')
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingGroup('')
    }
  }

  const startEditing = (group, term) => {
    setError('')
    setMessage('')
    setEditing({ group, id: term.id, label: term.label })
  }

  const cancelEditing = () => {
    setEditing({ group: '', id: '', label: '' })
  }

  const saveTerm = async () => {
    const group = editing.group
    const id = editing.id
    const label = String(editing.label || '').trim()

    if (!group || !id) return
    if (!label) {
      setError('Enter a name first.')
      return
    }

    try {
      setError('')
      setMessage('')
      setBusyAction({ group, id, type: 'save' })
      const result = await api.updateTaxonomyTerm(group, id, { label })
      await refresh()
      setEditing({ group: '', id: '', label: '' })
      setMessage(result?.message || 'Saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyAction({ group: '', id: '', type: '' })
    }
  }

  const deleteTerm = async (group, term) => {
    const confirmed =
      typeof window === 'undefined'
        ? true
        : window.confirm(
            group === 'collection'
              ? `Delete "${term.label}"? This will also remove this collection from all products assigned to it.`
              : `Delete "${term.label}"? This will also remove this filter from linked products.`
          )

    if (!confirmed) return

    try {
      setError('')
      setMessage('')
      setBusyAction({ group, id: term.id, type: 'delete' })
      const result = await api.deleteTaxonomyTerm(group, term.id)
      await refresh()
      if (editing.group === group && editing.id === term.id) {
        setEditing({ group: '', id: '', label: '' })
      }
      setMessage(result?.message || 'Deleted.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyAction({ group: '', id: '', type: '' })
    }
  }

  return (
    <div className="bg-sand min-h-screen">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs uppercase tracking-[0.35em] text-muted">Admin</p>
          <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">Filters & collections</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted">
            Add new purpose, family, season, gender, and collection filters here. Collections you create can then receive products directly from the admin side.
          </p>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
          {FILTER_GROUPS.map((group) => (
            <div
              key={group.id}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-muted">{group.title}</p>
              <p className="mt-3 text-sm text-muted">{group.description}</p>

              <div className="mt-6 grid gap-3">
                {(termsByGroup[group.id] || []).map((term) => {
                  const isEditing = editing.group === group.id && editing.id === term.id
                  const isBusy =
                    busyAction.group === group.id && busyAction.id === term.id && busyAction.type !== ''

                  return (
                    <div
                      key={term.id}
                      className="rounded-2xl border border-slate-200/80 bg-clay/50 p-4"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            value={editing.label}
                            onChange={(e) => setEditing((prev) => ({ ...prev, label: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={saveTerm}
                              disabled={isBusy}
                              className="rounded-full bg-ember px-4 py-2 text-xs font-semibold text-white transition hover:bg-emberDark disabled:opacity-60"
                            >
                              {isBusy ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink">{term.label}</p>
                            <p className="mt-1 text-xs text-muted">Slug: {term.id}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {group.id === 'collection' ? (
                              <Link
                                to={`/collections/${encodeURIComponent(term.id)}`}
                                className="rounded-full border border-gold/25 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emberDark transition hover:border-gold/60"
                              >
                                Manage
                              </Link>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => startEditing(group.id, term)}
                              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emberDark transition hover:border-gold/60"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTerm(group.id, term)}
                              disabled={isBusy}
                              className="rounded-full border border-red-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-600 transition hover:border-red-300 disabled:opacity-60"
                            >
                              {isBusy ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                {!loading && (termsByGroup[group.id] || []).length === 0 ? (
                  <p className="text-sm text-muted">
                    {group.id === 'collection' ? 'No collections yet.' : 'No filters yet.'}
                  </p>
                ) : null}
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200/80 bg-clay/50 p-4">
                <label className="text-sm font-semibold text-ink">
                  {group.id === 'collection' ? 'Collection name' : 'Add new filter'}
                </label>
                <input
                  value={drafts[group.id]}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [group.id]: e.target.value }))}
                  placeholder={
                    group.id === 'purpose'
                      ? 'For Ayurveda rituals'
                      : group.id === 'family'
                        ? 'Smoky'
                        : 'Self Care'
                  }
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">
                    {group.id === 'collection' ? 'URL id will be generated automatically.' : 'Slug will be generated automatically.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => createFilter(group.id)}
                    disabled={savingGroup === group.id}
                    className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white transition hover:bg-emberDark disabled:opacity-60"
                  >
                    {savingGroup === group.id ? 'Saving…' : group.id === 'collection' ? 'Add collection' : 'Add filter'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(message || error) && (
          <div className="mx-auto mt-6 w-full max-w-6xl">
            {message ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  )
}

export default AdminFilters
