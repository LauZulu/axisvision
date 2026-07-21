import { getDb } from './db'
import { AxisProduct } from './db/entities/Product'
import { AxisProductImage } from './db/entities/ProductImage'
import { AxisUser } from './db/entities/User'
import { AxisOrder } from './db/entities/Order'
import type { ProductDTO } from '../lib/products'

export type AdminStats = {
  productsTotal: number
  productsActive: number
  lowStock: number
  totalStock: number
  users: number
  orders: number
}

const LOW_STOCK_THRESHOLD = 3

export async function getAdminStats(): Promise<AdminStats> {
  const db = await getDb()
  const productRepo = db.getRepository(AxisProduct)
  const [productsTotal, productsActive, lowStock, users, orders] = await Promise.all([
    productRepo.count(),
    productRepo.count({ where: { active: true } }),
    productRepo
      .createQueryBuilder('p')
      .where('p.stock <= :n', { n: LOW_STOCK_THRESHOLD })
      .getCount(),
    db.getRepository(AxisUser).count(),
    db.getRepository(AxisOrder).count(),
  ])
  const sum = await productRepo
    .createQueryBuilder('p')
    .select('COALESCE(SUM(p.stock), 0)', 'total')
    .getRawOne<{ total: string }>()
  return {
    productsTotal,
    productsActive,
    lowStock,
    totalStock: Number(sum?.total ?? 0),
    users,
    orders,
  }
}

export type ProductInput = {
  slug: string
  name: string
  taglineEs: string
  taglineEn: string
  descriptionEs: string
  descriptionEn: string
  priceCop: number
  stock: number
  active: boolean
  position: number
  images: string[]
}

async function replaceImages(productId: string, keys: string[]) {
  const db = await getDb()
  const imageRepo = db.getRepository(AxisProductImage)
  await imageRepo.delete({ productId })
  if (keys.length > 0) {
    await imageRepo.save(
      keys.map((imageKey, position) => imageRepo.create({ productId, imageKey, position })),
    )
  }
}

export async function createProduct(input: ProductInput): Promise<string> {
  const db = await getDb()
  const repo = db.getRepository(AxisProduct)
  const product = await repo.save(
    repo.create({
      slug: input.slug,
      name: input.name,
      taglineEs: input.taglineEs,
      taglineEn: input.taglineEn,
      descriptionEs: input.descriptionEs,
      descriptionEn: input.descriptionEn,
      priceCop: input.priceCop,
      currency: 'COP',
      stock: input.stock,
      active: input.active,
      position: input.position,
    }),
  )
  await replaceImages(product.id, input.images)
  return product.id
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<boolean> {
  const db = await getDb()
  const repo = db.getRepository(AxisProduct)
  const product = await repo.findOne({ where: { id } })
  if (!product) return false

  const { images, ...fields } = patch
  Object.assign(product, fields)
  await repo.save(product)
  if (images) await replaceImages(id, images)
  return true
}

/** Baja lógica: oculta de la tienda sin borrar el histórico. */
export async function softDeleteProduct(id: string): Promise<boolean> {
  const db = await getDb()
  const repo = db.getRepository(AxisProduct)
  const result = await repo.update({ id }, { active: false })
  return (result.affected ?? 0) > 0
}

export type { ProductDTO }
