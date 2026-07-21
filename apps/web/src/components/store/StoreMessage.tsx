'use client'

import Link from 'next/link'
import { useDict } from '../../i18n/useDict'

/** Estado vacío/elegante de la tienda (no encontrado / no disponible). */
export function StoreMessage({ title, body }: { title: string; body: string }) {
  const { t } = useDict()
  return (
    <section className="py-28 md:py-36">
      <div className="container-axis text-center">
        <h1 className="font-head text-2xl text-warm-white md:text-3xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-warm-gray/70">{body}</p>
        <Link href="/tienda" className="btn-axis mt-8 inline-flex">
          {t.store.back}
        </Link>
      </div>
    </section>
  )
}

export function StoreNotFound() {
  const { t } = useDict()
  return <StoreMessage title={t.store.notFoundTitle} body={t.store.notFoundBody} />
}

export function StoreUnavailable() {
  const { t } = useDict()
  return <StoreMessage title={t.store.unavailableTitle} body={t.store.unavailableBody} />
}
