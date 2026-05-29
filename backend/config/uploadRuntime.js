const getCloudinaryConfig = () => {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim()
  const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim()
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim()

  if (!cloudName || !apiKey || !apiSecret) return null
  return { cloudName, apiKey, apiSecret }
}

const localFallbackAllowed = () =>
  String(process.env.ALLOW_LOCAL_UPLOADS || '').trim().toLowerCase() === 'true' || process.env.NODE_ENV !== 'production'

const getUploadRuntimeStatus = () => {
  const cloudinary = getCloudinaryConfig()
  const canUseLocalFallback = localFallbackAllowed()
  const ready = Boolean(cloudinary) || canUseLocalFallback

  return {
    ready,
    provider: cloudinary ? 'cloudinary' : canUseLocalFallback ? 'local' : 'unavailable',
    hasCloudinary: Boolean(cloudinary),
    localFallbackAllowed: canUseLocalFallback,
    productionRequiresCloudinary: process.env.NODE_ENV === 'production' && !canUseLocalFallback,
  }
}

module.exports = {
  getCloudinaryConfig,
  getUploadRuntimeStatus,
}
