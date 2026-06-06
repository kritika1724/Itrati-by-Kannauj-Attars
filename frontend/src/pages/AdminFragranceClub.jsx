import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

const formatCurrency = (value) => {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? `₹${Math.round(amount).toLocaleString('en-IN')}` : '₹0'
}

const getPaymentLabel = (order) => {
  if (!order) return 'No payment'
  const method = String(order.paymentMethod || '').toUpperCase()
  if (order.isPaid === true) return 'Paid'
  if (method === 'COD') return 'COD selected'
  if (method === 'RAZORPAY') return 'Payment pending'
  return 'Unpaid'
}

const paymentPillClass = (order) => {
  if (!order) return 'border-slate-200 bg-white text-muted'
  if (order.isPaid === true) return 'bg-emerald-600 text-white'
  if (String(order.paymentMethod || '').toUpperCase() === 'COD') return 'bg-amber-500 text-white'
  return 'bg-red-600 text-white'
}

const memberMatches = (member, query) => {
  if (!query) return true
  const latestOrder = member.orderSummary?.latestOrder || {}
  const haystack = [
    member.fullName,
    member.mobileNumber,
    member.email,
    member.city,
    member.state,
    member.couponCode,
    latestOrder.publicOrderId,
    latestOrder.status,
    latestOrder.paymentMethod,
    ...(Array.isArray(member.cartItems) ? member.cartItems : []),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(query)
}

function AdminFragranceClub() {
  const [members, setMembers] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.getFragranceClubMembers()
      setMembers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Could not load fragrance club members.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return members.filter((member) => memberMatches(member, normalizedQuery))
  }, [members, query])

  const totalCartValue = useMemo(
    () => members.reduce((sum, member) => sum + Number(member.cartValue || 0), 0),
    [members]
  )
  const orderedMembers = useMemo(
    () => members.filter((member) => member.orderSummary?.hasOrder).length,
    [members]
  )
  const paidMembers = useMemo(
    () => members.filter((member) => Number(member.orderSummary?.paidOrderCount || 0) > 0).length,
    [members]
  )

  return (
    <div className="min-h-screen bg-sand">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted">Admin</p>
            <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">Fragrance Club</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              Members captured from the add-to-cart Fragrance Club form.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emberDark hover:border-gold/40"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white transition hover:bg-emberDark disabled:opacity-60"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto w-full max-w-7xl">
          {error ? (
            <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-black/10">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Total members</p>
              <p className="mt-3 font-display text-4xl text-ink">{members.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-black/10">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Matching view</p>
              <p className="mt-3 font-display text-4xl text-ink">{filteredMembers.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-black/10">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Signup cart value</p>
              <p className="mt-3 font-display text-4xl text-ink">{formatCurrency(totalCartValue)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-black/10">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Converted / paid</p>
              <p className="mt-3 font-display text-4xl text-ink">
                {orderedMembers}/{paidMembers}
              </p>
              <p className="mt-2 text-xs text-muted">Ordered members / online paid members</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-black/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted">Members</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">Saved customer details</h2>
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, phone, email, city..."
                className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15 sm:w-80"
              />
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[1160px] border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.24em] text-muted">
                    <th className="px-4 py-2 font-semibold">Member</th>
                    <th className="px-4 py-2 font-semibold">Contact</th>
                    <th className="px-4 py-2 font-semibold">Address</th>
                    <th className="px-4 py-2 font-semibold">Signup cart</th>
                    <th className="px-4 py-2 font-semibold">Order / payment</th>
                    <th className="px-4 py-2 font-semibold">Reward</th>
                    <th className="px-4 py-2 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => {
                    const summary = member.orderSummary || {}
                    const latestOrder = summary.latestOrder || null

                    return (
                      <tr key={member._id} className="rounded-2xl bg-clay/60 align-top text-sm text-ink">
                        <td className="rounded-l-2xl px-4 py-4">
                          <p className="font-semibold">{member.fullName || '—'}</p>
                          <p className="mt-1 text-xs text-muted">{member.memberStatus || 'member'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold">{member.mobileNumber || '—'}</p>
                          <p className="mt-1 text-xs text-muted">{member.email || '—'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p>{member.addressLine1 || '—'}</p>
                          <p className="mt-1 text-xs text-muted">
                            {[member.city, member.state].filter(Boolean).join(', ') || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold">{formatCurrency(member.cartValue)}</p>
                          <p className="mt-1 max-w-xs truncate text-xs text-muted">
                            {(Array.isArray(member.cartItems) && member.cartItems.length > 0)
                              ? member.cartItems.join(', ')
                              : 'No cart items saved'}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {latestOrder ? (
                            <>
                              <Link
                                to={`/order/${latestOrder.id}`}
                                className="font-semibold text-emberDark hover:text-ink"
                              >
                                {latestOrder.publicOrderId || latestOrder.id}
                              </Link>
                              <p className="mt-1 text-xs text-muted">
                                {formatCurrency(latestOrder.totalPrice)} • {latestOrder.status || 'pending'}
                              </p>
                              <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${paymentPillClass(latestOrder)}`}>
                                {getPaymentLabel(latestOrder)}
                              </span>
                              {Number(summary.orderCount || 0) > 1 ? (
                                <p className="mt-2 text-xs text-muted">{summary.orderCount} orders after signup</p>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-muted">No order yet</p>
                              <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-muted">
                                No payment
                              </span>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold">{member.couponCode || '—'}</p>
                          <p className="mt-1 text-xs text-muted">
                            {Number(member.discountPercent || 0) > 0 ? `${member.discountPercent}% off` : '—'}
                          </p>
                        </td>
                        <td className="rounded-r-2xl px-4 py-4 text-xs text-muted">
                          {formatDate(member.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {!loading && filteredMembers.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-slate-200 bg-clay/60 px-4 py-4 text-sm text-muted">
                No fragrance club members found.
              </p>
            ) : null}
            {loading ? <p className="mt-6 text-sm text-muted">Loading members…</p> : null}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminFragranceClub
