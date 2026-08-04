'use client'

import { useDict } from '../../i18n/useDict'
import { OrderTable } from './OrderTable'
import type { OrderDTO } from '../../lib/orders'

export function OrdersView({ orders }: { orders: OrderDTO[] }) {
  const { t } = useDict()
  const o = t.admin.orders
  return (
    <div>
      <h1 className="font-head text-xl text-warm-white sm:text-2xl">{o.title}</h1>
      <p className="mt-1 text-sm text-warm-gray/60 sm:text-base">{o.subtitle}</p>
      <div className="mt-6 sm:mt-8">
        <OrderTable orders={orders} />
      </div>
    </div>
  )
}
