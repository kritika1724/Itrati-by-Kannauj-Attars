function ReviewStars({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= Number(value || 0)
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-xl transition ${
              active
                ? 'border-[#C8A96A] bg-[rgba(200,169,106,0.14)] text-[#C9A24A]'
                : 'border-[rgba(25,33,60,0.12)] bg-white text-[#CFD4DF] hover:border-[rgba(200,169,106,0.3)] hover:text-[#C9A24A]'
            }`}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}

export default ReviewStars
