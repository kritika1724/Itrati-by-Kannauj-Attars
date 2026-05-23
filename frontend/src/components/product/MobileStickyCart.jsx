import WishlistButton from './WishlistButton'

function MobileStickyCart({ productId, price, packLabel = '', onAddToCart, onBuyNow, disabled = false }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[65] border-t border-[rgba(25,33,60,0.08)] bg-[rgba(255,255,255,0.94)] px-4 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] pt-3 shadow-[0_-18px_46px_rgba(25,33,60,0.14)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8D7667]">Selected</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-[#19213C]">₹{Number(price || 0).toLocaleString('en-IN')}</span>
            {packLabel ? <span className="text-xs font-medium text-[#6B6F7A]">{packLabel}</span> : null}
          </div>
        </div>
        <WishlistButton productId={productId} />
        <button
          type="button"
          onClick={onAddToCart}
          disabled={disabled}
          className="rounded-full bg-[linear-gradient(135deg,#E9D28A_0%,#C9A24A_100%)] px-4 py-3 text-sm font-semibold text-[#1B233F] disabled:opacity-50"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onBuyNow}
          disabled={disabled}
          className="rounded-full bg-[#19213C] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Buy
        </button>
      </div>
    </div>
  )
}

export default MobileStickyCart
