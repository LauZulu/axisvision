import { getDb } from './db'
import { AxisProduct } from './db/entities/Product'
import { AxisProductImage } from './db/entities/ProductImage'
import { deleteObjects } from './s3'
import type { ProductDTO } from '../lib/products'

export type AdminStats = {
  productsTotal: number
  productsActive: number
  lowStock: number
  totalStock: number
  inventoryValueCop: number
}

export const LOW_STOCK_THRESHOLD = 3

export async function getAdminStats(): Promise<AdminStats> {
  const db = await getDb()
  const productRepo = db.getRepository(AxisProduct)
  const [productsTotal, productsActive, lowStock] = await Promise.all([
    productRepo.count(),
    productRepo.count({ where: { active: true } }),
    productRepo
      .createQueryBuilder('p')
      .where('p.stock <= :n', { n: LOW_STOCK_THRESHOLD })
      .getCount(),
  ])
  const agg = await productRepo
    .createQueryBuilder('p')
    .select('COALESCE(SUM(p.stock), 0)', 'units')
    .addSelect('COALESCE(SUM(p.stock * p."priceCop"), 0)', 'value')
    .getRawOne<{ units: string; value: string }>()
  return {
    productsTotal,
    productsActive,
    lowStock,
    totalStock: Number(agg?.units ?? 0),
    inventoryValueCop: Number(agg?.value ?? 0),
  }
}

export type LowStockProduct = {
  id: string
  slug: string
  name: string
  stock: number
  priceCop: number
}

/** Productos con stock igual o por debajo del umbral (para reponer). */
export async function getLowStockProducts(
  threshold = LOW_STOCK_THRESHOLD,
): Promise<LowStockProduct[]> {
  const db = await getDb()
  const rows = await db
    .getRepository(AxisProduct)
    .createQueryBuilder('p')
    .where('p.stock <= :n', { n: threshold })
    .orderBy('p.stock', 'ASC')
    .getMany()
  return rows.map((p) => ({ id: p.id, slug: p.slug, name: p.name, stock: p.stock, priceCop: p.priceCop }))
}

export type ProductInput = {
  slug: string
  name: string
  taglineEs: string
  taglineEn: string
  descriptionEs: string
  descriptionEn: string
  priceCop: number
  compareAtPriceCop?: number | null
  stock: number
  active: boolean
  position: number
  images: string[]
}

async function replaceImages(productId: string, keys: string[]) {
  const db = await getDb()
  const imageRepo = db.getRepository(AxisProductImage)
  const old = await imageRepo.find({ where: { productId } })
  const oldKeys = old.map((i) => i.imageKey)

  await imageRepo.delete({ productId })
  if (keys.length > 0) {
    await imageRepo.save(
      keys.map((imageKey, position) => imageRepo.create({ productId, imageKey, position })),
    )
  }

  // Limpia de S3 las fotos que se quitaron (best-effort; ignora claves locales).
  const removed = oldKeys.filter((k) => !keys.includes(k))
  if (removed.length) await deleteObjects(removed)
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
      compareAtPriceCop: input.compareAtPriceCop ?? null,
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

/**
 * Borrado definitivo. Elimina el producto y sus fotos/favoritos (FK cascade).
 * Las líneas de pedidos conservan su snapshot (nombre/precio), así el historial
 * de ventas no se altera. Devuelve las claves S3 de sus fotos para limpiarlas.
 */
export async function hardDeleteProduct(id: string): Promise<{ deleted: boolean; imageKeys: string[] }> {
  const db = await getDb()
  const productRepo = db.getRepository(AxisProduct)
  const product = await productRepo.findOne({ where: { id }, relations: { images: true } })
  if (!product) return { deleted: false, imageKeys: [] }
  const imageKeys = (product.images ?? []).map((img) => img.imageKey)
  await productRepo.delete({ id })
  return { deleted: true, imageKeys }
}

export type { ProductDTO }
