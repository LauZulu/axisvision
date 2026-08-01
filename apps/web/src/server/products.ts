import { getDb } from './db'
import { AxisProduct } from './db/entities/Product'
import { AxisProductUnit } from './db/entities/ProductUnit'
import type { ProductDTO } from '../lib/products'
import { cdnUrl, isRemoteImage } from '../lib/cdn'

function toDTO(p: AxisProduct, unitsTotal?: number): ProductDTO {
  const images = (p.images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((img) => ({
      key: img.imageKey,
      // S3/CloudFront → URL pública; imagen local de prueba → null (se resuelve en el cliente).
      url: isRemoteImage(img.imageKey) ? cdnUrl(img.imageKey) : null,
      position: img.position,
      lensVariant: img.lensVariant ?? null,
    }))
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    modelCode: p.modelCode ?? null,
    size: p.size ?? null,
    taglineEs: p.taglineEs,
    taglineEn: p.taglineEn,
    descriptionEs: p.descriptionEs,
    descriptionEn: p.descriptionEn,
    priceCop: p.priceCop,
    compareAtPriceCop: p.compareAtPriceCop ?? null,
    currency: p.currency,
    stock: p.stock,
    active: p.active,
    position: p.position,
    images,
    ...(unitsTotal === undefined ? {} : { unitsTotal }),
  }
}

/** Unidades físicas por producto (todas). Solo para las vistas del admin. */
async function unitCounts(): Promise<Map<string, number>> {
  const db = await getDb()
  const rows = await db
    .createQueryBuilder()
    .select('u."productId"', 'productId')
    .addSelect('COUNT(*)', 'count')
    .from(AxisProductUnit, 'u')
    .groupBy('u."productId"')
    .getRawMany<{ productId: string; count: string }>()
  return new Map(rows.map((r) => [r.productId, Number(r.count)]))
}

/** Productos activos para la tienda, ordenados por `position`. */
export async function getActiveProducts(): Promise<ProductDTO[]> {
  const db = await getDb()
  const rows = await db.getRepository(AxisProduct).find({
    where: { active: true },
    relations: { images: true },
    order: { position: 'ASC' },
  })
  // Lambda explícita: `map(toDTO)` pasaría el índice como `unitsTotal`.
  return rows.map((p) => toDTO(p))
}

/** Todos los productos (incluye inactivos) — para el admin. */
export async function getAllProducts(): Promise<ProductDTO[]> {
  const db = await getDb()
  const [rows, counts] = await Promise.all([
    db.getRepository(AxisProduct).find({
      relations: { images: true },
      order: { position: 'ASC' },
    }),
    unitCounts(),
  ])
  return rows.map((p) => toDTO(p, counts.get(p.id) ?? 0))
}

/**
 * Producto por slug para la TIENDA (ficha pública y `GET /api/products/[slug]`).
 *
 * Filtra por `active` a propósito: sin eso, el interruptor de visibilidad del
 * admin solo escondía el producto del listado, y un modelo despublicado seguía
 * sirviéndose entero —precio, fotos y copy— a quien entrara por la URL directa.
 * El admin no pasa por aquí: edita con `getProductById`, que sí ve los ocultos.
 */
export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const db = await getDb()
  const p = await db
    .getRepository(AxisProduct)
    .findOne({ where: { slug, active: true }, relations: { images: true } })
  return p ? toDTO(p) : null
}

export async function getProductById(id: string): Promise<ProductDTO | null> {
  const db = await getDb()
  const p = await db
    .getRepository(AxisProduct)
    .findOne({ where: { id }, relations: { images: true } })
  if (!p) return null
  const total = await db.getRepository(AxisProductUnit).countBy({ productId: p.id })
  return toDTO(p, total)
}
