// Rate limiter simple en memoria (ventana deslizante por clave). Suficiente para
// una instancia; equivale al @Throttle(5/min) descrito para los logins. Si en el
// futuro hay múltiples instancias, migrar a Redis.
type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count += 1
  return true
}
