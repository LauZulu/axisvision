import { getAllLensOptions } from '../../../../src/server/lenses'
import { getRxPrices } from '../../../../src/server/lensPricing'
import { LensOptionsView } from '../../../../src/components/admin/LensOptionsView'
import { RxPriceMatrix } from '../../../../src/components/admin/RxPriceMatrix'
import { AdminDbError } from '../../../../src/components/admin/AdminDbError'

export const dynamic = 'force-dynamic'

export default async function AdminLensesPage() {
  try {
    const [options, prices] = await Promise.all([getAllLensOptions(), getRxPrices()])
    return (
      <>
        <LensOptionsView options={options} />
        {/* La matriz va DEBAJO del catálogo a propósito: primero se decide qué
            lentes existen y cuánto valen terminados, y solo después cuánto
            cuesta graduarlos. Al revés no se entiende de qué son esos precios. */}
        <RxPriceMatrix options={options} prices={prices} />
      </>
    )
  } catch (err) {
    console.error('[admin] lentes:', err)
    return <AdminDbError />
  }
}
