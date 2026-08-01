import './_env'
import { getDb } from '../src/server/db'
import { AxisOrder } from '../src/server/db/entities/Order'
import { fetchTransaction } from '../src/server/wompi'
import { confirmPaidOrder } from '../src/server/payments'
import { sendOrderFailedEmail } from '../src/server/orderEmails'

/**
 * Conciliación de pedidos colgados en `pending`.
 *
 *   pnpm payments:reconcile [--dry] [--horas=2]
 *
 * Para qué: el webhook de Wompi es el camino principal a `paid`, pero puede
 * fallar (URL mal registrada, servidor caído durante los tres reintentos de
 * 24 h). Este script vuelve a preguntarle a Wompi por los pedidos que se
 * quedaron a medias y los cuadra.
 *
 * **Límite importante y no evitable:** Wompi solo permite consultar
 * `GET /v1/transactions/{id}` — NO existe forma documentada de buscar una
 * transacción por nuestra referencia. Así que este script solo puede cuadrar
 * los pedidos de los que ya conocemos el id de transacción, que son aquellos
 * en los que el cliente volvió a la página de resultado (ahí se guarda el id
 * aunque el pago siga PENDING).
 *
 * Los pedidos `pending` SIN id de transacción se listan al final: esos hay que
 * mirarlos a mano en el panel de Wompi, buscando por la referencia `AXIS-…`.
 *
 * Es idempotente: se apoya en `confirmPaidOrder()`, el mismo claim atómico que
 * usan el webhook y la página de resultado. Correrlo dos veces no cobra ni
 * descuenta nada dos veces.
 */

const args = process.argv.slice(2)
const dry = args.includes('--dry')
const horas = Number(args.find((a) => a.startsWith('--horas='))?.split('=')[1]) || 2

async function main() {
  const db = await getDb()
  const desde = new Date(Date.now() - horas * 60 * 60 * 1000)

  const pendientes = await db
    .getRepository(AxisOrder)
    .createQueryBuilder('o')
    .where('o.status = :status', { status: 'pending' })
    .andWhere('o."createdAt" < :desde', { desde })
    .orderBy('o."createdAt"', 'ASC')
    .getMany()

  if (pendientes.length === 0) {
    console.log(`Sin pedidos pendientes de más de ${horas} h. Todo cuadrado.`)
    process.exit(0)
  }

  console.log(`${pendientes.length} pedido(s) en pending de más de ${horas} h${dry ? ' (simulacro)' : ''}\n`)

  const sinId: AxisOrder[] = []
  let aplicados = 0
  let fallidos = 0
  let sinCambio = 0

  for (const order of pendientes) {
    if (!order.wompiTransactionId) {
      sinId.push(order)
      continue
    }

    const tx = await fetchTransaction(order.wompiTransactionId).catch(() => null)
    if (!tx) {
      console.log(`  ${order.reference}  transacción no encontrada en Wompi`)
      continue
    }

    if (tx.status === 'APPROVED') {
      if (dry) {
        console.log(`  ${order.reference}  APPROVED → se marcaría pagado`)
      } else {
        const outcome = await confirmPaidOrder(order.reference, {
          id: tx.id,
          amountInCents: tx.amount_in_cents,
          currency: tx.currency,
          paymentMethodType: tx.payment_method_type,
        })
        console.log(`  ${order.reference}  APPROVED → ${outcome}`)
        if (outcome === 'applied') aplicados += 1
      }
    } else if (tx.status === 'DECLINED' || tx.status === 'ERROR') {
      if (dry) {
        console.log(`  ${order.reference}  ${tx.status} → se marcaría fallido`)
      } else {
        const res = await db
          .getRepository(AxisOrder)
          .update({ id: order.id, status: 'pending' }, { status: 'failed' })
        if ((res.affected ?? 0) === 1) {
          await sendOrderFailedEmail(order.id, tx.status_message)
          fallidos += 1
        }
        console.log(`  ${order.reference}  ${tx.status} → fallido`)
      }
    } else {
      console.log(`  ${order.reference}  ${tx.status} → sigue en curso, no se toca`)
      sinCambio += 1
    }
  }

  console.log(`\nResumen: ${aplicados} pagados · ${fallidos} fallidos · ${sinCambio} en curso`)

  if (sinId.length > 0) {
    console.log(
      `\n⚠ ${sinId.length} pedido(s) sin id de transacción — Wompi no deja buscarlos por referencia.`,
    )
    console.log('  Búscalos a mano en el panel de Wompi por estas referencias:')
    for (const o of sinId) {
      console.log(`    ${o.reference}  ${o.createdAt.toISOString()}  ${o.customerEmail}`)
    }
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
