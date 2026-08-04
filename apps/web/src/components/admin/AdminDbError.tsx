'use client'

import Link from 'next/link'
import { useDict } from '../../i18n/useDict'

/** Estado de "base de datos no disponible" traducido. */
export function AdminDbError() {
  const { t } = useDict()
  return (
    <div className="rounded-2xl border border-line bg-carbon-850 p-6 sm:p-8">
      <h1 className="font-head text-xl text-warm-white">{t.admin.common.dbTitle}</h1>
      <p className="mt-2 text-warm-gray/70">{t.admin.common.dbBody}</p>
    </div>
  )
}

/** Estado de "producto no encontrado" traducido. */
export function AdminProductNotFound() {
  const { t } = useDict()
  return (
    <div className="rounded-2xl border border-line bg-carbon-850 p-6 sm:p-8">
      <h1 className="font-head text-xl text-warm-white">{t.admin.form.notFound}</h1>
      <Link href="/admin/productos" className="btn-axis mt-6 inline-flex">
        {t.admin.form.back}
      </Link>
    </div>
  )
}
