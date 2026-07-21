import { getDb } from './db'
import { AxisProduct } from './db/entities/Product'
import type { ProductDTO } from '../lib/products'
import { cdnUrl, isRemoteImage } from '../lib/cdn'

function toDTO(p: AxisProduct): ProductDTO {
  const images = (p.images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((img) => ({
      key: img.imageKey,
      // S3/CloudFront → URL pública; imagen local de prueba → null (se resuelve en el cliente).
      url: isRemoteImage(img.imageKey) ? cdnUrl(img.imageKey) : null,
      position: img.position,
    }))
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    taglineEs: p.taglineEs,
    taglineEn: p.taglineEn,
    descriptionEs: p.descriptionEs,
    descriptionEn: p.descriptionEn,
    priceCop: p.priceCop,
    currency: p.currency,
    stock: p.stock,
    active: p.active,
    position: p.position,
    images,
  }
}

/** Productos activos para la tienda, ordenados por `position`. */
export async function getActiveProducts(): Promise<ProductDTO[]> {
  const db = await getDb()
  const rows = await db.getRepository(AxisProduct).find({
    where: { active: true },
    relations: { images: true },
    order: { position: 'ASC' },
  })
  return rows.map(toDTO)
}

/** Todos los productos (incluye inactivos) — para el admin. */
export async function getAllProducts(): Promise<ProductDTO[]> {
  const db = await getDb()
  const rows = await db.getRepository(AxisProduct).find({
    relations: { images: true },
    order: { position: 'ASC' },
  })
  return rows.map(toDTO)
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const db = await getDb()
  const p = await db
    .getRepository(AxisProduct)
    .findOne({ where: { slug }, relations: { images: true } })
  return p ? toDTO(p) : null
}

export async function getProductById(id: string): Promise<ProductDTO | null> {
  const db = await getDb()
  const p = await db
    .getRepository(AxisProduct)
    .findOne({ where: { id }, relations: { images: true } })
  return p ? toDTO(p) : null
}
