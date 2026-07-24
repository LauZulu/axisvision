import { fetchTransaction } from '../../../../src/server/wompi'
import {
  PaymentResultView,
  type PaymentResult,
} from '../../../../src/components/store/PaymentResultView'

export const dynamic = 'force-dynamic'

// Wompi redirige aquí con ?id=<transactionId>. El estado se verifica SERVER-SIDE
// contra la API de Wompi (el redirect por sí solo nunca confirma un pago).
export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams

  let result: PaymentResult = { found: false }
  if (id) {
    try {
      const tx = await fetchTransaction(id)
      if (tx) {
        result = {
          found: true,
          status: tx.status,
          reference: tx.reference,
          amountInCents: tx.amount_in_cents,
          paymentMethodType: tx.payment_method_type,
        }
      }
    } catch {
      result = { found: false }
    }
  }

  return <PaymentResultView result={result} />
}
