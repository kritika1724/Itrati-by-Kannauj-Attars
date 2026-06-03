const toPositiveInt = (value, fallback) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return Math.floor(parsed)
}

const getPublicCacheProfile = (
  prefix,
  { browserMaxAge, edgeMaxAge, staleWhileRevalidate, staleIfError = staleWhileRevalidate }
) => ({
  browserMaxAge: toPositiveInt(process.env[`CACHE_${prefix}_BROWSER_S`], browserMaxAge),
  edgeMaxAge: toPositiveInt(process.env[`CACHE_${prefix}_EDGE_S`], edgeMaxAge),
  staleWhileRevalidate: toPositiveInt(
    process.env[`CACHE_${prefix}_STALE_WHILE_REVALIDATE_S`],
    staleWhileRevalidate
  ),
  staleIfError: toPositiveInt(process.env[`CACHE_${prefix}_STALE_IF_ERROR_S`], staleIfError),
})

const setPublicCache = (res, profile) => {
  const directives = ['public', `max-age=${profile.browserMaxAge}`]

  if (profile.edgeMaxAge >= 0) {
    directives.push(`s-maxage=${profile.edgeMaxAge}`)
  }

  if (profile.staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${profile.staleWhileRevalidate}`)
  }

  if (profile.staleIfError > 0) {
    directives.push(`stale-if-error=${profile.staleIfError}`)
  }

  res.set('Cache-Control', directives.join(', '))
}

module.exports = {
  getPublicCacheProfile,
  setPublicCache,
}
