import { ProductForm } from '../../../../../src/components/admin/ProductForm'

export const dynamic = 'force-dynamic'

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-head text-2xl text-warm-white">Nuevo producto</h1>
      <p className="mt-1 text-warm-gray/60">Añade un modelo al catálogo.</p>
      <div className="mt-8">
        <ProductForm />
      </div>
    </div>
  )
}
