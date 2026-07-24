'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TreeLogo } from '../../../src/components/ui/TreeLogo'
import { useDict } from '../../../src/i18n/useDict'

export default function AdminLoginPage() {
  const { t } = useDict()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        router.replace('/admin')
        router.refresh()
        return
      }
      const data = await res.json().catch(() => null)
      setError(data?.error?.message ?? t.admin.login.error)
    } catch {
      setError(t.admin.login.netError)
    }
    setLoading(false)
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-gold">
          <TreeLogo className="h-9 w-auto" />
          <span className="font-mono text-xs tracking-[0.25em] text-warm-gray/70">
            AXIS · ADMIN
          </span>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-line bg-carbon-850 p-7"
          noValidate
        >
          <h1 className="font-head text-xl text-warm-white">{t.admin.login.title}</h1>
          <p className="mt-1 text-sm text-warm-gray/60">{t.admin.login.subtitle}</p>

          <label className="mt-6 block text-sm text-warm-gray/80">
            {t.admin.login.email}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-line bg-carbon-900 px-3 py-2.5 text-warm-white outline-none focus:border-gold/60"
              autoComplete="email"
            />
          </label>

          <label className="mt-4 block text-sm text-warm-gray/80">
            {t.admin.login.password}
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-line bg-carbon-900 px-3 py-2.5 text-warm-white outline-none focus:border-gold/60"
              autoComplete="current-password"
            />
          </label>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={loading} className="btn-axis mt-6 w-full disabled:opacity-60">
            {loading ? t.admin.login.entering : t.admin.login.enter}
          </button>
        </form>
      </div>
    </main>
  )
}
