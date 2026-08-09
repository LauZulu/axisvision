import { getDb } from './db'
import { AxisProduct } from './db/entities/Product'
import { AxisProductImage } from './db/entities/ProductImage'
import { AxisProductUnit } from './db/entities/ProductUnit'
import { AxisProductLensOption } from './db/entities/ProductLensOption'
import { syncStockFromUnits } from './inventory'
import { deleteObjects } from './s3'
import type { ImageLensVariant, ProductDTO } from '../lib/products'

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

/**
 * Foto tal y como la manda el panel. `lensVariant` ausente = "no la toques"
 * (conserva la que ya tuviera en la DB); `null` = sirve para cualquier lente.
 */
export type ProductImageInput = {
  key: string
  lensVariant?: ImageLensVariant | null
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
  images: ProductImageInput[]
  /**
   * Opciones de lente que ofrece el modelo. **Vacía = las ofrece todas** (es lo
   * normal); ausente = no tocar lo que ya hubiera guardado.
   */
  lensOptionIds?: string[]
}

/** Deja la lista de lentes del producto en exactamente `lensOptionIds`. */
async function replaceLensOptions(productId: string, lensOptionIds: string[]) {
  const db = await getDb()
  await db.transaction(async (manager) => {
    const repo = manager.getRepository(AxisProductLensOption)
    await repo.delete({ productId })
    if (lensOptionIds.length > 0) {
      await repo.insert(
        lensOptionIds.map((lensOptionId, position) => ({ productId, lensOptionId, position })),
      )
    }
  })
}

/**
 * Deja las fotos del producto en exactamente `keys`, en ese orden.
 *
 * Borrado + inserción van en UNA transacción. Antes eran dos pasos sueltos, así
 * que un fallo al insertar dejaba al producto SIN NINGUNA foto: es justo lo que
 * pasó en producción con el 500 de `Cyclic dependency` —AXIS Origin se quedó en
 * cero y la tienda lo mostró sin imágenes—. La limpieza de S3 va DESPUÉS del
 * commit y con el error contenido: borrar el objeto de una transacción que luego
 * se deshace no tiene vuelta atrás, y un fallo de S3 no puede tumbar un guardado
 * que la base ya dio por bueno.
 *
 * `lensVariant` solo se pisa si el panel la manda: una petición que trae la
 * clave suelta (formato viejo) conserva la variante que la foto ya tuviera. Sin
 * eso, cada guardado del panel dejaba todas las fotos como "sirve para cualquier
 * lente" y rompía en silencio la galería por lente de la ficha.
 */
async function replaceImages(productId: string, images: ProductImageInput[]) {
  const db = await getDb()
  const keys = images.map((i) => i.key)

  const removed = await db.transaction(async (manager) => {
    const imageRepo = manager.getRepository(AxisProductImage)
    const old = await imageRepo.find({ where: { productId } })
    const previous = new Map(old.map((i) => [i.imageKey, i.lensVariant]))

    await imageRepo.delete({ productId })
    if (images.length > 0) {
      await imageRepo.insert(
        images.map((img, position) => ({
          productId,
          imageKey: img.key,
          position,
          lensVariant:
            img.lensVariant !== undefined ? img.lensVariant : (previous.get(img.key) ?? null),
        })),
      )
    }
    return old.map((i) => i.imageKey).filter((k) => !keys.includes(k))
  })

  // Limpia de S3 las fotos que se quitaron (best-effort; ignora claves locales).
  if (removed.length) {
    await deleteObjects(removed).catch((err) =>
      console.error('[admin] no se pudieron borrar de S3 las fotos retiradas:', err),
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
  if (input.lensOptionIds) await replaceLensOptions(product.id, input.lensOptionIds)
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

  const { images, lensOptionIds, ...fields } = patch

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
  if (lensOptionIds) await replaceLensOptions(id, lensOptionIds)
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
