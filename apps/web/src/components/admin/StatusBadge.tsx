import type { OrderStatus } from '../../lib/orders'

// Colores funcionales (solo en el admin interno) para distinguir estados de un vistazo.
const TONE: Record<OrderStatus, string> = {
  pending: 'border-gold/40 text-gold',
  paid: 'border-emerald-400/40 text-emerald-300',
  shipped: 'border-sky-400/40 text-sky-300',
  delivered: 'border-emerald-500/50 text-emerald-400',
  cancelled: 'border-line text-warm-gray/55',
  failed: 'border-red-400/40 text-red-400',
}

export function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[0.65rem] tracking-widest ${TONE[status]}`}
    >
      {label}
    </span>
  )
}
