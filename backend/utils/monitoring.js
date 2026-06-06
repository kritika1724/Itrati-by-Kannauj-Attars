const MAX_LATENCY_SAMPLES = 400
const MAX_ALERTS = 80
const ALERT_WINDOW_MS = Math.max(60 * 1000, Number(process.env.MONITOR_ALERT_WINDOW_MS || 5 * 60 * 1000))
const HTTP_4XX_ALERT_THRESHOLD = Math.max(1, Number(process.env.MONITOR_4XX_ALERT_THRESHOLD || 25))
const HTTP_5XX_ALERT_THRESHOLD = Math.max(1, Number(process.env.MONITOR_5XX_ALERT_THRESHOLD || 5))
const SLOW_REQUEST_ALERT_THRESHOLD = Math.max(1, Number(process.env.MONITOR_SLOW_ALERT_THRESHOLD || 10))

const metrics = {
  startedAt: Date.now(),
  requestsTotal: 0,
  inFlight: 0,
  statusCounts: {
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0,
    other: 0,
  },
  routeCounts: new Map(),
  latencySamplesMs: [],
  recentAlerts: [],
}

const SLOW_REQUEST_MS = Math.max(250, Number(process.env.MONITOR_SLOW_REQUEST_MS || 1500))

const pushBounded = (list, value, max) => {
  list.push(value)
  if (list.length > max) list.shift()
}

const statusBucket = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) return '2xx'
  if (statusCode >= 300 && statusCode < 400) return '3xx'
  if (statusCode >= 400 && statusCode < 500) return '4xx'
  if (statusCode >= 500 && statusCode < 600) return '5xx'
  return 'other'
}

const formatWindowMinutes = (windowMs) => Number((windowMs / (60 * 1000)).toFixed(windowMs % (60 * 1000) === 0 ? 0 : 1))

const percentile = (values, p) => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return Number(sorted[index].toFixed(1))
}

const resolveRouteLabel = (req) => {
  if (req.baseUrl && req.route?.path) {
    return `${req.method} ${req.baseUrl}${req.route.path}`
  }
  if (req.route?.path) {
    return `${req.method} ${req.route.path}`
  }
  return `${req.method} ${(req.originalUrl || req.url || '/').split('?')[0]}`
}

const stripMethodPrefix = (method, path) => {
  const prefix = `${method} `
  return String(path || '').startsWith(prefix) ? String(path).slice(prefix.length) : path
}

const isExpectedSessionRefreshMiss = (req, statusCode, routeLabel) => {
  if (statusCode !== 401 || req.method !== 'POST') return false
  const path = stripMethodPrefix(req.method, routeLabel)
  return path === '/api/session/refresh'
}

const recordAlert = (alert) => {
  const event = {
    ...alert,
    time: new Date().toISOString(),
  }
  pushBounded(metrics.recentAlerts, event, MAX_ALERTS)

  const path = stripMethodPrefix(event.method, event.path)
  const line = `[monitor] ${event.severity.toUpperCase()} ${event.method} ${path} -> ${event.statusCode} in ${event.durationMs}ms`
  if (event.severity === 'error') {
    console.error(line)
  } else {
    console.warn(line)
  }
}

const requestMonitor = () => (req, res, next) => {
  const start = process.hrtime.bigint()
  metrics.inFlight += 1

  let settled = false
  const finish = () => {
    if (settled) return
    settled = true
    metrics.inFlight = Math.max(0, metrics.inFlight - 1)

    const durationMs = Number((process.hrtime.bigint() - start) / BigInt(1000000))
    const statusCode = Number(res.statusCode || 0)
    const bucket = statusBucket(statusCode)
    const routeLabel = resolveRouteLabel(req)

    metrics.requestsTotal += 1
    metrics.statusCounts[bucket] = (metrics.statusCounts[bucket] || 0) + 1
    metrics.routeCounts.set(routeLabel, (metrics.routeCounts.get(routeLabel) || 0) + 1)
    pushBounded(metrics.latencySamplesMs, durationMs, MAX_LATENCY_SAMPLES)

    if (statusCode >= 400) {
      if (isExpectedSessionRefreshMiss(req, statusCode, routeLabel)) return

      recordAlert({
        severity: statusCode >= 500 ? 'error' : 'warn',
        type: statusCode >= 500 ? 'http_5xx' : 'http_4xx',
        method: req.method,
        path: routeLabel,
        statusCode,
        durationMs,
      })
      return
    }

    if (durationMs >= SLOW_REQUEST_MS) {
      recordAlert({
        severity: 'warn',
        type: 'slow_request',
        method: req.method,
        path: routeLabel,
        statusCode,
        durationMs,
      })
    }
  }

  res.on('finish', finish)
  res.on('close', finish)
  next()
}

const getMonitoringSnapshot = () => {
  const samples = metrics.latencySamplesMs
  const average =
    samples.length > 0 ? Number((samples.reduce((sum, value) => sum + value, 0) / samples.length).toFixed(1)) : 0
  const windowStart = Date.now() - ALERT_WINDOW_MS
  const rollingCounts = {
    http4xx: 0,
    http5xx: 0,
    slowRequests: 0,
  }

  metrics.recentAlerts.forEach((alert) => {
    const time = Date.parse(alert.time)
    if (!Number.isFinite(time) || time < windowStart) return
    if (alert.type === 'http_4xx') rollingCounts.http4xx += 1
    if (alert.type === 'http_5xx') rollingCounts.http5xx += 1
    if (alert.type === 'slow_request') rollingCounts.slowRequests += 1
  })

  const activeAlerts = []
  if (rollingCounts.http5xx >= HTTP_5XX_ALERT_THRESHOLD) {
    activeAlerts.push({
      severity: 'error',
      type: 'http_5xx_burst',
      count: rollingCounts.http5xx,
      threshold: HTTP_5XX_ALERT_THRESHOLD,
      windowMs: ALERT_WINDOW_MS,
      message: `${rollingCounts.http5xx} server errors in the last ${formatWindowMinutes(ALERT_WINDOW_MS)} minute(s)`,
    })
  }
  if (rollingCounts.http4xx >= HTTP_4XX_ALERT_THRESHOLD) {
    activeAlerts.push({
      severity: 'warn',
      type: 'http_4xx_burst',
      count: rollingCounts.http4xx,
      threshold: HTTP_4XX_ALERT_THRESHOLD,
      windowMs: ALERT_WINDOW_MS,
      message: `${rollingCounts.http4xx} client errors in the last ${formatWindowMinutes(ALERT_WINDOW_MS)} minute(s)`,
    })
  }
  if (rollingCounts.slowRequests >= SLOW_REQUEST_ALERT_THRESHOLD) {
    activeAlerts.push({
      severity: 'warn',
      type: 'slow_request_burst',
      count: rollingCounts.slowRequests,
      threshold: SLOW_REQUEST_ALERT_THRESHOLD,
      windowMs: ALERT_WINDOW_MS,
      message: `${rollingCounts.slowRequests} slow requests in the last ${formatWindowMinutes(ALERT_WINDOW_MS)} minute(s)`,
    })
  }

  return {
    startedAt: new Date(metrics.startedAt).toISOString(),
    uptimeSeconds: Math.floor((Date.now() - metrics.startedAt) / 1000),
    state: activeAlerts.some((alert) => alert.severity === 'error') ? 'alert' : activeAlerts.length ? 'warn' : 'ok',
    inFlight: metrics.inFlight,
    requestsTotal: metrics.requestsTotal,
    responseTimeMs: {
      average,
      p95: percentile(samples, 95),
      thresholdForSlowAlert: SLOW_REQUEST_MS,
    },
    statusCounts: metrics.statusCounts,
    alertThresholds: {
      windowMs: ALERT_WINDOW_MS,
      http4xx: HTTP_4XX_ALERT_THRESHOLD,
      http5xx: HTTP_5XX_ALERT_THRESHOLD,
      slowRequests: SLOW_REQUEST_ALERT_THRESHOLD,
    },
    rollingWindow: rollingCounts,
    activeAlerts,
    topRoutes: [...metrics.routeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([route, count]) => ({ route, count })),
    recentAlerts: [...metrics.recentAlerts].reverse().slice(0, 12),
  }
}

module.exports = {
  requestMonitor,
  getMonitoringSnapshot,
}
