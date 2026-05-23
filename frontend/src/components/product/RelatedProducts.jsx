import { Link } from 'react-router-dom'
import { toAssetUrl } from '../../utils/media'
import { getMinPack, getNoteLine } from './productPresentation'

function RelatedProducts({ products = [], familyMap = {} }) {
  if (!products.length) return null

  return (
    <section className="rounded-[2rem] border border-[rgba(25,33,60,0.08)] bg-white/90 p-5 shadow-[0_22px_60px_rgba(25,33,60,0.07)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">You may also like</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#19213C]">Related fragrances</h2>
        </div>
        <Link to="/products" className="text-sm font-semibold text-[#19213C] transition hover:text-[#C9A24A]">
          Explore more
        </Link>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory">
        {products.map((item) => {
          const minPack = getMinPack(Array.isArray(item?.packs) ? item.packs : [])
          const price = minPack ? minPack.effectivePrice : item?.price
          return (
            <Link
              key={item._id}
              to={`/products/${item._id}`}
              className="snap-start min-w-[18rem] max-w-[20rem] flex-1 overflow-hidden rounded-[1.8rem] border border-[rgba(25,33,60,0.08)] bg-[rgba(252,249,243,0.92)] shadow-[0_18px_48px_rgba(25,33,60,0.06)] transition hover:-translate-y-1 hover:border-[rgba(200,169,106,0.34)]"
            >
              <div className="aspect-[4/3.1] overflow-hidden bg-[linear-gradient(135deg,rgba(200,169,106,0.18),rgba(255,255,255,0.98),rgba(25,33,60,0.08))]">
                {item?.images?.[0] ? (
                  <img
                    src={toAssetUrl(item.images[0], import.meta.env.VITE_API_ASSET)}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-500 hover:scale-[1.04]"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8D7667]">{item.category || 'Attar'}</p>
                <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-[#19213C]">{item.name}</h3>
                <p className="mt-2 text-sm text-[#5F6475]">{getNoteLine(item, familyMap)}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-base font-semibold text-[#19213C]">₹{Number(price || 0).toLocaleString('en-IN')}</span>
                  {minPack?.label ? <span className="text-xs font-medium text-[#6B6F7A]">{minPack.label}</span> : null}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default RelatedProducts
