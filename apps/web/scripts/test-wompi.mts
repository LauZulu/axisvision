import './_env'
import { createHash } from 'node:crypto'

// Prueba end-to-end del flujo Wompi SIN red externa: llama al handler del
// webhook directamente con eventos forjados (firmados con el mismo secreto),
// contra la DB real. Verifica: checksum inválido→403, APPROVED→paid+stock−,
// reintento→idempotente, DECLINED→failed, VOIDED→cancelled+restock. Limpia todo.

// Secretos de prueba SOLO para esta corrida (si el .env no los trae aún).
process.env.WOMPI_EVENTS_SECRET ||= 'test_events_simulacion_local'
process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ||= 'pub_test_simulacion'
process.env.WOMPI_INTEGRITY_SECRET ||= 'test_integrity_simulacion'

const { POST: webhook } = await import('../app/api/wompi/webhook/route')
const { createGuestOrder } = await import('../src/server/checkout')
const { getDb, AxisProduct, AxisOrder } = await import('../src/server/db')

const sha256 = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex')

function forgeEvent(tx: {
  id: string
  status: string
  reference: string
  amount_in_cents: number
  currency?: string
  payment_method_type?: string
}, opts?: { badChecksum?: boolean }) {
  const timestamp = 1721000000
  const properties = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents']
  const concatenated =
    `${tx.id}${tx.status}${tx.amount_in_cents}` + String(timestamp) + process.env.WOMPI_EVENTS_SECRET!
  const checksum = opts?.badChecksum ? sha256('forjado-invalido') : sha256(concatenated)
  return {
    event: 'transaction.updated',
    data: { transaction: { currency: 'COP', payment_method_type: 'CARD', ...tx } },
    sent_at: new Date(1721000000000).toISOString(),
    timestamp,
    signature: { checksum, properties },
  }
}

const post = (body: unknown) =>
  webhook(
    new Request('http://localhost/api/wompi/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )

async function main() {
  const db = await getDb()
  const productRepo = db.getRepository(AxisProduct)
  const orderRepo = db.getRepository(AxisOrder)

  const onyx = await productRepo.findOneOrFail({ where: { slug: 'axis-onyx' } })
  const stock0 = onyx.stock
  console.log(`Producto de prueba: ${onyx.slug} (stock inicial ${stock0})`)

  const createdRefs: string[] = []
  let failures = 0
  const check = (label: string, ok: boolean, extra = '') => {
    console.log(`  ${ok ? '✓' : '✗'} ${label}${extra ? ` — ${extra}` : ''}`)
    if (!ok) failures++
  }

  // Orden A (qty 2) — para APPROVED / reintento / VOIDED
  const a = await createGuestOrder({
    customer: { name: 'Test Wompi', email: 'test-wompi@axisvision.co' },
    items: [{ productId: onyx.id, quantity: 2 }],
  })
  if (!a.ok) throw new Error('no se pudo crear la orden A')
  createdRefs.push(a.order.reference)
  const cents = a.order.amountCop * 100
  console.log(`Orden A: ${a.order.reference} ($${a.order.amountCop} → ${cents} centavos)`)
  check('checkout devuelve parámetros firmados', a.order.payment !== null,
    a.order.payment ? `firma ${a.order.payment.signature.slice(0, 12)}…` : 'payment null')

  // 1) Checksum inválido → 403 y nada cambia
  let res = await post(forgeEvent({ id: 'tx-A', status: 'APPROVED', reference: a.order.reference, amount_in_cents: cents }, { badChecksum: true }))
  check('checksum inválido → 403', res.status === 403)

  // 2) APPROVED con monto EQUIVOCADO → no marca pagado
  res = await post(forgeEvent({ id: 'tx-A', status: 'APPROVED', reference: a.order.reference, amount_in_cents: 1 }))
  let orderA = await orderRepo.findOneOrFail({ where: { reference: a.order.reference } })
  check('monto equivocado → sigue pending', res.status === 200 && orderA.status === 'pending')

  // 3) APPROVED válido → paid + stock −2
  res = await post(forgeEvent({ id: 'tx-A', status: 'APPROVED', reference: a.order.reference, amount_in_cents: cents }))
  orderA = await orderRepo.findOneOrFail({ where: { reference: a.order.reference } })
  let stockNow = (await productRepo.findOneOrFail({ where: { id: onyx.id } })).stock
  check('APPROVED → paid', res.status === 200 && orderA.status === 'paid',
    `paidAt=${orderA.paidAt ? 'sí' : 'no'}, método=${orderA.paymentMethodType}`)
  check('stock descontado (−2)', stockNow === stock0 - 2, `stock ${stock0}→${stockNow}`)

  // 4) Reintento del MISMO evento → idempotente (stock no vuelve a bajar)
  res = await post(forgeEvent({ id: 'tx-A', status: 'APPROVED', reference: a.order.reference, amount_in_cents: cents }))
  stockNow = (await productRepo.findOneOrFail({ where: { id: onyx.id } })).stock
  check('reintento idempotente (stock intacto)', res.status === 200 && stockNow === stock0 - 2)

  // 5) Orden B → DECLINED → failed sin tocar stock
  const b = await createGuestOrder({
    customer: { name: 'Test Wompi B', email: 'test-wompi@axisvision.co' },
    items: [{ productId: onyx.id, quantity: 1 }],
  })
  if (!b.ok) throw new Error('no se pudo crear la orden B')
  createdRefs.push(b.order.reference)
  res = await post(forgeEvent({ id: 'tx-B', status: 'DECLINED', reference: b.order.reference, amount_in_cents: b.order.amountCop * 100 }))
  const orderB = await orderRepo.findOneOrFail({ where: { reference: b.order.reference } })
  stockNow = (await productRepo.findOneOrFail({ where: { id: onyx.id } })).stock
  check('DECLINED → failed, stock intacto', res.status === 200 && orderB.status === 'failed' && stockNow === stock0 - 2)

  // 6) VOIDED sobre la orden A pagada → cancelled + restock (+2)
  res = await post(forgeEvent({ id: 'tx-A', status: 'VOIDED', reference: a.order.reference, amount_in_cents: cents }))
  orderA = await orderRepo.findOneOrFail({ where: { reference: a.order.reference } })
  stockNow = (await productRepo.findOneOrFail({ where: { id: onyx.id } })).stock
  check('VOIDED → cancelled + restock', res.status === 200 && orderA.status === 'cancelled' && stockNow === stock0)

  // Limpieza: borrar órdenes de prueba y restaurar stock exacto
  for (const ref of createdRefs) await orderRepo.delete({ reference: ref })
  await productRepo.update({ id: onyx.id }, { stock: stock0 })
  console.log(`Limpieza: ${createdRefs.length} órdenes de prueba borradas, stock restaurado a ${stock0}`)

  console.log(failures === 0 ? '✓ TODAS las pruebas pasaron' : `✗ ${failures} pruebas FALLARON`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('✗ Prueba falló:', e instanceof Error ? e.message : e)
  process.exit(1)
})
