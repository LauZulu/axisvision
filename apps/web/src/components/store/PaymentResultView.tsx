'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { formatCop } from '../../lib/products'
import { whatsappLink } from '../../config/brand'

export type PaymentResult = {
  found: boolean
  status?: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR'
  reference?: string
  amountInCents?: number
  paymentMethodType?: string
}

/** Vista del resultado del pago (bilingüe). El estado viene verificado del server. */
export function PaymentResultView({ result }: { result: PaymentResult }) {
  const { t } = useDict()
  const p = t.payment
  const router = useRouter()

  const status = result.found ? result.status : undefined
  const view =
    status === 'APPROVED'
      ? { icon: 'check' as const, tone: 'text-gold', title: p.approvedTitle, body: p.approvedBody }
      : status === 'PENDING'
        ? { icon: 'battery' as const, tone: 'text-warm-gray/70', title: p.pendingTitle, body: p.pendingBody }
        : status === 'DECLINED' || status === 'VOIDED'
          ? { icon: 'norisk' as const, tone: 'text-red-400', title: p.declinedTitle, body: p.declinedBody }
          : { icon: 'norisk' as const, tone: 'text-red-400', title: p.errorTitle, body: p.errorBody }

  return (
    <section className="py-24 md:py-32">
      <div className="container-axis max-w-xl text-center">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full border border-line ${view.tone}`}>
          <Icon name={view.icon} size={28} />
        </div>
        <h1 className="mt-6 font-head text-2xl text-warm-white md:text-3xl">{view.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-warm-gray/70">{view.body}</p>

        {result.found && (
          <dl className="mx-auto mt-8 max-w-sm space-y-2 rounded-2xl border border-line bg-carbon-850 p-5 text-sm">
            {result.reference && (
              <div className="flex justify-between gap-4">
                <dt className="text-warm-gray/55">{p.reference}</dt>
                <dd className="font-mono text-warm-white">{result.reference}</dd>
              </div>
            )}
            {typeof result.amountInCents === 'number' && (
              <div className="flex justify-between gap-4">
                <dt className="text-warm-gray/55">{p.amount}</dt>
                <dd className="text-warm-white">{formatCop(result.amountInCents / 100)}</dd>
              </div>
            )}
            {result.paymentMethodType && (
              <div className="flex justify-between gap-4">
                <dt className="text-warm-gray/55">{p.method}</dt>
                <dd className="font-mono text-warm-white">{result.paymentMethodType}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          {status === 'PENDING' && (
            <button type="button" onClick={() => router.refresh()} className="btn-axis">
              {p.refresh}
            </button>
          )}
          {(status === 'DECLINED' || status === 'VOIDED' || !result.found) && (
            <Link href="/tienda/checkout" className="btn-axis">
              {p.tryAgain}
            </Link>
          )}
          <Link
            href="/tienda"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-line px-6 py-[0.95rem] font-head text-sm text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold"
          >
            {p.backToStore}
          </Link>
          <a
            href={whatsappLink('general')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-line px-6 py-[0.95rem] font-head text-sm text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold"
          >
            <Icon name="whatsapp" size={16} />
            {p.helpWhatsapp}
          </a>
        </div>
      </div>
    </section>
  )
}
