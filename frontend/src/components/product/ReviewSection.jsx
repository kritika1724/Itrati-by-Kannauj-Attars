import ReviewStars from './ReviewStars'

function ReviewSection({
  product,
  isAdmin = false,
  reviewOpen,
  onToggleReview,
  reviewMessage = '',
  hasReviews = false,
  selectedRating = 0,
  register,
  errors = {},
  setValue,
  handleSubmit,
  onSubmit,
}) {
  return (
    <section className="space-y-6">
      {!isAdmin ? (
        <div className="rounded-[2rem] border border-[rgba(25,33,60,0.08)] bg-white/90 p-5 shadow-[0_22px_60px_rgba(25,33,60,0.07)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Customer reviews</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#19213C]">Verified voices only</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5F6475]">
                To review {product?.name}, enter the Order ID for a delivered purchase that included this product.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleReview}
              className="rounded-full border border-[rgba(25,33,60,0.1)] bg-white px-4 py-2 text-sm font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.34)]"
            >
              {reviewOpen ? 'Hide form' : 'Write a review'}
            </button>
          </div>

          {reviewOpen ? (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <label className="text-sm font-semibold text-[#19213C]">Order ID</label>
                <input
                  {...register('orderId')}
                  placeholder="KA-XXXXXX"
                  className="mt-2 w-full rounded-[1.2rem] border border-[rgba(25,33,60,0.1)] bg-white px-4 py-3 text-sm text-[#19213C] outline-none placeholder:text-[#98A0B2] focus:border-[rgba(200,169,106,0.44)]"
                />
                {errors.orderId ? <p className="mt-2 text-xs text-red-600">{errors.orderId.message}</p> : null}
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-[#19213C]">Your rating</label>
                  <span className="text-xs font-semibold text-[#6B6F7A]">{selectedRating ? `${selectedRating} / 5` : 'Tap a star'}</span>
                </div>
                <div className="mt-3">
                  <ReviewStars value={selectedRating} onChange={(value) => setValue('rating', value, { shouldValidate: true })} />
                </div>
                {errors.rating ? <p className="mt-2 text-xs text-red-600">{errors.rating.message}</p> : null}
              </div>

              <div className="lg:col-span-2">
                <label className="text-sm font-semibold text-[#19213C]">Comment (optional)</label>
                <textarea
                  rows="4"
                  {...register('comment')}
                  placeholder="Share the trail, feeling, longevity, or how it wore during the day."
                  className="mt-2 w-full rounded-[1.2rem] border border-[rgba(25,33,60,0.1)] bg-white px-4 py-3 text-sm text-[#19213C] outline-none placeholder:text-[#98A0B2] focus:border-[rgba(200,169,106,0.44)]"
                />
                {errors.comment ? <p className="mt-2 text-xs text-red-600">{errors.comment.message}</p> : null}
              </div>

              <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-[linear-gradient(135deg,#E9D28A_0%,#C9A24A_100%)] px-6 py-3 text-sm font-semibold text-[#1B233F] shadow-[0_18px_40px_rgba(196,139,106,0.24)]"
                >
                  Submit review
                </button>
                {reviewMessage ? <p className="text-sm font-semibold text-[#C9A24A]">{reviewMessage}</p> : null}
              </div>
            </form>
          ) : reviewMessage ? (
            <p className="mt-4 text-sm font-semibold text-[#C9A24A]">{reviewMessage}</p>
          ) : null}
        </div>
      ) : null}

      {hasReviews ? (
        <div className="rounded-[2rem] border border-[rgba(25,33,60,0.08)] bg-white/90 p-5 shadow-[0_22px_60px_rgba(25,33,60,0.07)] sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Reviews</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#19213C]">Customer impressions</h3>
            </div>
            <p className="rounded-full border border-[rgba(25,33,60,0.08)] bg-white px-4 py-2 text-sm font-semibold text-[#19213C]">
              {Number(product?.rating || 0).toFixed(1)} / 5 • {product?.numReviews || 0} reviews
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {(product?.reviews || []).map((review) => (
              <article
                key={review._id}
                className="rounded-[1.5rem] border border-[rgba(25,33,60,0.08)] bg-[rgba(252,249,243,0.92)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#19213C]">{review.name}</p>
                    {review.verifiedPurchase ? (
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#C9A24A]">
                        Verified purchase
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-[#C9A24A]">{'★'.repeat(Number(review.rating || 0))}</p>
                </div>
                {review.comment ? <p className="mt-3 text-sm leading-7 text-[#5F6475]">{review.comment}</p> : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ReviewSection
