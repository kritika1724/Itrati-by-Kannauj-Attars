const MAX_LATENCY_SAMPLES = 400
const MAX_ALERTS = 80

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

const recordAlert = (alert) => {
  const event = {
    ...alert,
    time: new Date().toISOString(),
  }
  pushBounded(metrics.recentAlerts, event, MAX_ALERTS)

  const line = `[monitor] ${event.severity.toUpperCase()} ${event.method} ${event.path} -> ${event.statusCode} in ${event.durationMs}ms`
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

  return {
    startedAt: new Date(metrics.startedAt).toISOString(),
    uptimeSeconds: Math.floor((Date.now() - metrics.startedAt) / 1000),
    inFlight: metrics.inFlight,
    requestsTotal: metrics.requestsTotal,
    responseTimeMs: {
      average,
      p95: percentile(samples, 95),
      thresholdForSlowAlert: SLOW_REQUEST_MS,
    },
    statusCounts: metrics.statusCounts,
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
