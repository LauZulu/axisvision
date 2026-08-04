import { getDb } from './db'
import { AxisProduct } from './db/entities/Product'
import { AxisProductImage } from './db/entities/ProductImage'
import { AxisProductUnit } from './db/entities/ProductUnit'
import { syncStockFromUnits } from './inventory'
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

/**
 * Las cinco cifras del dashboard en UNA sola consulta (agregados con FILTER).
 * Antes eran cuatro viajes a la RDS —tres `count()` en paralelo y después el
 * `SUM`— y cada viaje cuesta un round-trip completo: medido, 722 ms para leer
 * seis filas de producto. Con una sola pasada es un round-trip.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const db = await getDb()
  const row = await db
    .getRepository(AxisProduct)
    .createQueryBuilder('p')
    .select('COUNT(*)', 'total')
    .addSelect('COUNT(*) FILTER (WHERE p.active)', 'active')
    .addSelect('COUNT(*) FILTER (WHERE p.stock <= :n)', 'low')
    .addSelect('COALESCE(SUM(p.stock), 0)', 'units')
    .addSelect('COALESCE(SUM(p.stock * p."priceCop"), 0)', 'value')
    .setParameter('n', LOW_STOCK_THRESHOLD)
    .getRawOne<{ total: string; active: string; low: string; units: string; value: string }>()
  return {
    productsTotal: Number(row?.total ?? 0),
    productsActive: Number(row?.active ?? 0),
    lowStock: Number(row?.low ?? 0),
    totalStock: Number(row?.units ?? 0),
    inventoryValueCop: Number(row?.value ?? 0),
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
  modelCode?: string | null
  size?: 'chico' | 'mediano' | 'grande' | null
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
      // Vacío → null: el índice único de modelCode admite varios NULL.
      modelCode: input.modelCode?.trim() || null,
      size: input.size ?? null,
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

  // El stock es DERIVADO del inventario por unidad: si el producto tiene
  // unidades cargadas, el valor que venga del formulario se ignora (si no, un
  // guardado del admin pisaría el conteo real con un número tecleado).
  const hasUnits = await db.getRepository(AxisProductUnit).existsBy({ productId: id })
  if (hasUnits) delete fields.stock

  // Vacío → null (el índice único de modelCode admite varios NULL).
  if (fields.modelCode !== undefined) fields.modelCode = fields.modelCode?.trim() || null

  Object.assign(product, fields)
  await repo.save(product)
  if (hasUnits) await syncStockFromUnits(db, id)
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
