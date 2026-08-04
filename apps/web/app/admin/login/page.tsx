'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TreeLogo } from '../../../src/components/ui/TreeLogo'
import { Icon } from '../../../src/components/ui/Icon'
import { useDict } from '../../../src/i18n/useDict'

export default function AdminLoginPage() {
  const { t } = useDict()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
        // Sin `router.refresh()` detrás: `replace()` ya pide al servidor el
        // render de /admin (la ruta es force-dynamic, no hay caché de cliente
        // que refrescar), y el refresh lo renderizaba OTRA vez — el panel
        // entero, con sus consultas, dos veces por cada inicio de sesión.
        router.replace('/admin')
        return
      }
      const data = await res.json().catch(() => null)
      setError(data?.error?.message ?? t.admin.login.error)
    } catch {
      setError(t.admin.login.netError)
    }
    setLoading(false)
  }

  // `text-base` (16px) en los inputs a propósito: por debajo de 16px Safari de
  // iOS hace zoom al enfocar y deja el formulario descuadrado.
  const inputClass =
    'mt-1.5 w-full rounded-md border border-line bg-carbon-900 px-3 py-2.5 text-base text-warm-white outline-none focus:border-gold/60'

  return (
    <main className="relative grid min-h-[100svh] place-items-center px-5 py-10 sm:px-6">
      {/* Salida a la landing. Es un <Link> a "/" y no un history.back(): a
          /admin/login se llega también desde un marcador o escribiendo la URL,
          y ahí no hay atrás al que volver. En móvil no había ninguna forma de
          salir de esta pantalla sin los gestos del navegador. */}
      <Link
        href="/"
        className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-warm-gray/60 transition-colors hover:text-gold sm:left-5 sm:top-5"
      >
        <Icon name="arrow" size={17} className="rotate-180" />
        {t.admin.nav.backToSite}
      </Link>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-gold">
          <TreeLogo className="h-9 w-auto" />
          <span className="font-mono text-xs tracking-[0.25em] text-warm-gray/70">
            AXIS · ADMIN
          </span>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-line bg-carbon-850 p-6 sm:p-7"
          noValidate
        >
          <h1 className="font-head text-xl text-warm-white">{t.admin.login.title}</h1>
          <p className="mt-1 text-sm text-warm-gray/60">{t.admin.login.subtitle}</p>

          <div className="mt-6">
            <label htmlFor="admin-email" className="block text-sm text-warm-gray/80">
              {t.admin.login.email}
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          {/* El campo va con su label por `htmlFor` en vez de anidado: el botón del
              ojo es interactivo y dentro de un <label> el clic dispararía también
              el reenfoque del input. */}
          <div className="mt-4">
            <label htmlFor="admin-password" className="block text-sm text-warm-gray/80">
              {t.admin.login.password}
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                /* `::-ms-reveal` fuera: Edge pinta su propio ojo y saldrían dos. */
                className={`${inputClass} pr-12 [&::-ms-reveal]:hidden`}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? t.admin.login.hidePassword : t.admin.login.showPassword
                }
                aria-pressed={showPassword}
                aria-controls="admin-password"
                title={showPassword ? t.admin.login.hidePassword : t.admin.login.showPassword}
                className="absolute bottom-0 right-0 top-1.5 grid w-11 place-items-center rounded-r-md text-warm-gray/55 transition-colors hover:text-gold"
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={19} />
              </button>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={loading} className="btn-axis mt-6 w-full disabled:opacity-60">
            {loading ? t.admin.login.entering : t.admin.login.enter}
          </button>
        </form>
      </div>
    </main>
  )
}
