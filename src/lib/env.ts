// Fail-fast environment validation. Runs once at server boot via
// instrumentation.ts. Development and tests never hard-fail; production does,
// because a misconfigured production takes fake money or breaks auth.

function fail(message: string): never {
  console.error(`[env] FATAL: ${message}`)
  throw new Error(message)
}

export function validateEnv(): void {
  if (process.env.SKIP_ENV_VALIDATION === '1') return
  if (process.env.NODE_ENV !== 'production') return

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || ''
  if (secret.length < 32) {
    fail('AUTH_SECRET (or NEXTAUTH_SECRET) must be set to at least 32 characters in production.')
  }

  for (const key of ['NEXTAUTH_URL', 'PLATFORM_URL'] as const) {
    const value = process.env[key] || ''
    if (!value) fail(`${key} must be set in production (e.g. https://yourdomain.com).`)
    if (/localhost|127\.0\.0\.1/i.test(value)) {
      fail(`${key} still points at localhost (${value}) — auth callbacks and links will break.`)
    }
    if (!value.startsWith('https://')) {
      fail(`${key} must use https in production (got ${value}).`)
    }
  }

  if (!process.env.DATABASE_URL) {
    fail('DATABASE_URL must be set in production.')
  }

  // Real money gate: Chargily test mode in production silently takes $0.
  if ((process.env.PAYMENT_PROVIDER || 'manual') === 'chargily' && process.env.CHARGILY_ENV !== 'live') {
    fail('PAYMENT_PROVIDER=chargily but CHARGILY_ENV is not "live" — refusing to run production on test keys.')
  }
}
