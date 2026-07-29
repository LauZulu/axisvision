import { z } from 'zod'

/** Esquema de producto para crear (todos los campos). */
export const productSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  name: z.string().min(1).max(120),
  // Código del inventario ("M02"): la llave contra el Excel. Único, o vacío.
  modelCode: z.string().max(40).nullable().optional(),
  size: z.enum(['chico', 'mediano', 'grande']).nullable().optional(),
  taglineEs: z.string().min(1).max(200),
  taglineEn: z.string().min(1).max(200),
  descriptionEs: z.string().min(1),
  descriptionEn: z.string().min(1),
  priceCop: z.number().int().min(0),
  compareAtPriceCop: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0),
  active: z.boolean(),
  position: z.number().int().min(0),
  images: z.array(z.string().min(1)).max(12),
})

/** Para editar: todos opcionales. */
export const productPatchSchema = productSchema.partial()

export type ProductSchema = z.infer<typeof productSchema>

/** Opción de lente (personalización que el cliente elige al comprar). */
export const lensOptionSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  nameEs: z.string().min(1).max(120),
  nameEn: z.string().min(1).max(120),
  descriptionEs: z.string().max(300).default(''),
  descriptionEn: z.string().max(300).default(''),
  extraPriceCop: z.number().int().min(0),
  requiresPrescription: z.boolean(),
  isDefault: z.boolean(),
  active: z.boolean(),
  position: z.number().int().min(0),
  imageVariant: z.enum(['sunglass', 'ophthalmic', 'yellow']).nullable().optional(),
})

export const lensOptionPatchSchema = lensOptionSchema.partial()

/** Edición de una unidad física del inventario. */
export const productUnitPatchSchema = z.object({
  location: z.enum(['fds', 'casa', 'local', 'sold']).optional(),
  sellable: z.boolean().optional(),
  note: z.string().max(500).nullable().optional(),
})
