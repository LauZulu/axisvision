import { z } from 'zod'

/** Esquema de producto para crear (todos los campos). */
export const productSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  name: z.string().min(1).max(120),
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
