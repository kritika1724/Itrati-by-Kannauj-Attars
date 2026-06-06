import { useEffect, useRef } from 'react'

export const prepareAutoplayVideo = (video) => {
  if (!video) return

  video.autoplay = true
  video.muted = true
  video.defaultMuted = true
  video.loop = true
  video.playsInline = true
  video.preload = 'auto'
  video.setAttribute('autoplay', '')
  video.setAttribute('muted', '')
  video.setAttribute('loop', '')
  video.setAttribute('playsinline', '')
  video.setAttribute('webkit-playsinline', '')
}

export const playAutoplayVideo = (video) => {
  if (!video) return

  prepareAutoplayVideo(video)
  try {
    const playPromise = video.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {})
    }
  } catch {
    // Browser autoplay policies can still block playback until the next user gesture.
  }
}

const hasVideoNode = (node) => {
  if (!node || node.nodeType !== 1) return false
  return node.matches?.('video, source') || node.querySelector?.('video, source')
}

export const useGlobalAutoplayVideos = () => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    let frame = 0
    const playAllVideos = () => {
      frame = 0
      document.querySelectorAll('video').forEach(playAutoplayVideo)
    }
    const schedulePlayAllVideos = () => {
      if (frame) return
      if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
        frame = window.requestAnimationFrame(playAllVideos)
      } else {
        playAllVideos()
      }
    }

    schedulePlayAllVideos()

    const events = ['pageshow', 'focus', 'pointerdown', 'touchstart', 'orientationchange']
    events.forEach((eventName) => window.addEventListener(eventName, schedulePlayAllVideos))
    document.addEventListener('visibilitychange', schedulePlayAllVideos)

    let observer
    if (typeof MutationObserver !== 'undefined' && document.body) {
      observer = new MutationObserver((mutations) => {
        const shouldPlay = mutations.some((mutation) => {
          if (mutation.type === 'attributes') {
            return hasVideoNode(mutation.target) || mutation.target?.closest?.('video')
          }
          return Array.from(mutation.addedNodes).some(hasVideoNode)
        })
        if (shouldPlay) schedulePlayAllVideos()
      })
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['autoplay', 'loop', 'muted', 'playsinline', 'src'],
      })
    }

    return () => {
      if (frame && typeof window !== 'undefined' && 'cancelAnimationFrame' in window) {
        window.cancelAnimationFrame(frame)
      }
      events.forEach((eventName) => window.removeEventListener(eventName, schedulePlayAllVideos))
      document.removeEventListener('visibilitychange', schedulePlayAllVideos)
      observer?.disconnect()
    }
  }, [])
}

export const useAutoplayVideo = (source) => {
  const ref = useRef(null)

  useEffect(() => {
    const video = ref.current
    if (!video || !source) return undefined

    const ensurePlayback = () => playAutoplayVideo(video)

    ensurePlayback()
    video.addEventListener('loadedmetadata', ensurePlayback)
    video.addEventListener('loadeddata', ensurePlayback)
    video.addEventListener('canplay', ensurePlayback)
    video.addEventListener('canplaythrough', ensurePlayback)
    window.addEventListener('pageshow', ensurePlayback)
    window.addEventListener('focus', ensurePlayback)
    window.addEventListener('pointerdown', ensurePlayback)
    window.addEventListener('touchstart', ensurePlayback)
    document.addEventListener('visibilitychange', ensurePlayback)

    return () => {
      video.removeEventListener('loadedmetadata', ensurePlayback)
      video.removeEventListener('loadeddata', ensurePlayback)
      video.removeEventListener('canplay', ensurePlayback)
      video.removeEventListener('canplaythrough', ensurePlayback)
      window.removeEventListener('pageshow', ensurePlayback)
      window.removeEventListener('focus', ensurePlayback)
      window.removeEventListener('pointerdown', ensurePlayback)
      window.removeEventListener('touchstart', ensurePlayback)
      document.removeEventListener('visibilitychange', ensurePlayback)
    }
  }, [source])

  return ref
}
