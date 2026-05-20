export const easeOutExpo = [0.22, 1, 0.36, 1]

export const viewportOnce = {
  once: true,
  amount: 0.18,
}

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOutExpo },
  },
}

export const fadeLeft = {
  hidden: { opacity: 0, x: -28 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: easeOutExpo },
  },
}

export const fadeRight = {
  hidden: { opacity: 0, x: 28 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: easeOutExpo },
  },
}

export const revealCard = {
  hidden: { opacity: 0, y: 22, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.62, ease: easeOutExpo },
  },
}

export const heroStagger = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.09,
    },
  },
}

export const staggerGrid = (staggerChildren = 0.08, delayChildren = 0.04) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
})

export const pageShell = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: easeOutExpo,
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: {
      duration: 0.16,
      ease: [0.4, 0, 1, 1],
    },
  },
}
