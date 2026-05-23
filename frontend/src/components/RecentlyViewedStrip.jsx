import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearRecent } from '../features/recentlyViewedSlice'
import { toAssetUrl } from '../utils/media'

function RecentlyViewedStrip({ excludeId = '', max = 8, title = 'Recently viewed' }) {
  const dispatch = useDispatch()
  const items = useSelector((state) => state.recentlyViewed.items)
  const filtered = (Array.isArray(items) ? items : [])
    .filter((x) => x?.product && x.product !== excludeId)
    .slice(0, max)

  if (filtered.length === 0) return null

  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1480px]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">History</p>
            <h2 className="mt-3 font-display text-3xl tracking-[-0.03em] text-[#19213C] sm:text-4xl">{title}</h2>
          </div>
          <button
            type="button"
            onClick={() => dispatch(clearRecent())}
            className="rounded-full border border-[rgba(25,33,60,0.1)] bg-white px-5 py-2 text-xs font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.34)]"
          >
            Clear
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
          {filtered.map((item) => (
            <Link
              key={item.product}
              to={`/products/${item.product}`}
              className="min-w-[220px] flex-1 rounded-[1.7rem] border border-[rgba(25,33,60,0.08)] bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_18px_48px_rgba(25,33,60,0.06)] transition hover:-translate-y-1 hover:border-[rgba(200,169,106,0.34)]"
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-[1.3rem] bg-[linear-gradient(135deg,rgba(200,169,106,0.18),rgba(255,255,255,0.98),rgba(25,33,60,0.08))]">
                {item.image ? (
                  <img
                    src={toAssetUrl(item.image, import.meta.env.VITE_API_ASSET)}
                    alt={item.name}
                    className="h-full w-full bg-white object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full bg-[linear-gradient(135deg,rgba(200,169,106,0.22),rgba(255,255,255,0.92),rgba(25,33,60,0.10))]" />
                )}
              </div>
              <h3 className="mt-4 line-clamp-1 text-sm font-semibold text-[#19213C]">{item.name}</h3>
              <p className="mt-2 text-xs font-semibold text-[#C9A24A]">
                {item.packLabel ? (
                  <>
                    {item.packLabel} / ₹{item.price}
                  </>
                ) : (
                  <>₹{item.price}</>
                )}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RecentlyViewedStrip
