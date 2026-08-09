import { getDb } from '../../../../src/server/db'
import { AxisOrder } from '../../../../src/server/db/entities/Order'
import { fetchTransaction } from '../../../../src/server/wompi'
import { confirmPaidOrder, rememberTransactionId } from '../../../../src/server/payments'
import {
  PaymentResultView,
  type PaymentResult,
} from '../../../../src/components/store/PaymentResultView'

export const dynamic = 'force-dynamic'

/**
 * Wompi redirige aquí con `?id=<transactionId>`. El estado se verifica
 * SERVER-SIDE contra la API de Wompi: el redirect por sí solo nunca confirma un
 * pago (cualquiera puede escribir esa URL).
 *
 * Dos cosas más que hace esta página, y las dos importan:
 *
 *  1. Comprueba que la referencia de la transacción sea de ESTA tienda. Sin eso,
 *     pasar el id de una transacción ajena mostraría su referencia y su monto.
 *  2. Si Wompi dice APPROVED, confirma el pedido por su cuenta. El webhook sigue
 *     siendo el camino principal, pero hoy es el ÚNICO: si su URL está mal
 *     puesta en el panel de Wompi, o el servidor estuvo caído durante los tres
 *     reintentos que Wompi hace en 24 h, el cliente pagaría y el pedido se
 *     quedaría en `pending` para siempre. `confirmPaidOrder()` usa el mismo
 *     claim atómico, así que da igual quién llegue primero: solo uno aplica.
 */
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
        const db = await getDb()
        const order = await db
          .getRepository(AxisOrder)
          .findOne({ where: { reference: tx.reference } })

        // Transacción real pero de otra tienda (o referencia desconocida): se
        // trata como no encontrada en vez de mostrar datos que no son nuestros.
        if (order) {
          // Se guarda el id de transacción aunque el pago aún no esté aprobado
          // (PSE pasa por PENDING varios minutos). Sin ese id, si el webhook
          // nunca llega el pedido no se puede conciliar: Wompi no deja buscar
          // una transacción por nuestra referencia, solo por su id.
          await rememberTransactionId(order.id, tx.id).catch(() => undefined)

          if (tx.status === 'APPROVED') {
            await confirmPaidOrder(tx.reference, {
              id: tx.id,
              amountInCents: tx.amount_in_cents,
              currency: tx.currency,
              paymentMethodType: tx.payment_method_type,
            }).catch((err) => {
              console.error('[pago] no se pudo confirmar desde la página de resultado:', err)
            })
          }
          result = {
            found: true,
            status: tx.status,
            reference: tx.reference,
            amountInCents: tx.amount_in_cents,
            paymentMethodType: tx.payment_method_type,
          }
        }
      }
    } catch (err) {
      // Quien acaba de pagar ve "no encontramos la transacción". Sin este log,
      // un fallo consultando a Wompi es indistinguible de un id inventado, y es
      // el peor momento posible para no tener rastro.
      console.error('[pago] no se pudo consultar la transacción %s:', id, err)
      result = { found: false }
    }
  }

  return <PaymentResultView result={result} />
}
