import { getDb } from './db'
import { AxisLensOption } from './db/entities/LensOption'
import type { LensOptionDTO } from '../lib/lenses'

function toDTO(o: AxisLensOption): LensOptionDTO {
  return {
    id: o.id,
    slug: o.slug,
    nameEs: o.nameEs,
    nameEn: o.nameEn,
    descriptionEs: o.descriptionEs,
    descriptionEn: o.descriptionEn,
    extraPriceCop: o.extraPriceCop,
    requiresPrescription: o.requiresPrescription,
    isDefault: o.isDefault,
    active: o.active,
    position: o.position,
    imageVariant: o.imageVariant ?? null,
  }
}

/** Opciones visibles en la tienda, ordenadas. */
export async function getActiveLensOptions(): Promise<LensOptionDTO[]> {
  const db = await getDb()
  const rows = await db.getRepository(AxisLensOption).find({
    where: { active: true },
    order: { position: 'ASC' },
  })
  return rows.map(toDTO)
}

/** Todas las opciones (incluye inactivas) — para el admin. */
export async function getAllLensOptions(): Promise<LensOptionDTO[]> {
  const db = await getDb()
  const rows = await db.getRepository(AxisLensOption).find({ order: { position: 'ASC' } })
  return rows.map(toDTO)
}

export type LensOptionInput = {
  imageVariant?: 'sunglass' | 'ophthalmic' | 'yellow' | null
  slug: string
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  extraPriceCop: number
  requiresPrescription: boolean
  isDefault: boolean
  active: boolean
  position: number
}

/** Solo una opción puede ser la de fábrica: al marcar una, se desmarcan las demás. */
async function clearOtherDefaults(exceptId: string) {
  const db = await getDb()
  await db
    .getRepository(AxisLensOption)
    .createQueryBuilder()
    .update()
    .set({ isDefault: false })
    .where('id != :id', { id: exceptId })
    .execute()
}

export async function createLensOption(input: LensOptionInput): Promise<string> {
  const db = await getDb()
  const repo = db.getRepository(AxisLensOption)
  const saved = await repo.save(repo.create(input))
  if (saved.isDefault) await clearOtherDefaults(saved.id)
  return saved.id
}

export async function updateLensOption(
  id: string,
  patch: Partial<LensOptionInput>,
): Promise<boolean> {
  const db = await getDb()
  const repo = db.getRepository(AxisLensOption)
  const option = await repo.findOne({ where: { id } })
  if (!option) return false
  Object.assign(option, patch)
  await repo.save(option)
  if (option.isDefault) await clearOtherDefaults(option.id)
  return true
}

export async function deleteLensOption(id: string): Promise<boolean> {
  const db = await getDb()
  const result = await db.getRepository(AxisLensOption).delete({ id })
  return (result.affected ?? 0) > 0
}
