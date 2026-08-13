import { z } from 'zod'

/**
 * Una foto del producto: la clave en S3 y con qué lente se tomó.
 *
 * Acepta también la clave suelta (`"products/…jpg"`), que es lo que mandaba el
 * panel antes de que las fotos llevaran variante. En ese caso `lensVariant`
 * queda `undefined`, que NO significa "sin variante" sino "no lo toques": el
 * servidor conserva la que ya tuviera la foto.
 *
 * El tope de 30 no es decorativo: un modelo con fotos de sol + transparente +
 * amarillo pasa de 12 sin esfuerzo, y con el tope viejo Eclypse (13 fotos) no se
 * podía guardar desde el panel — devolvía "Datos de producto inválidos".
 */
const productImageSchema = z
  .union([
    z.string().min(1).max(512),
    z.object({
      key: z.string().min(1).max(512),
      lensVariant: z.enum(['sunglass', 'ophthalmic', 'yellow']).nullable().optional(),
    }),
  ])
  .transform((v) => (typeof v === 'string' ? { key: v } : v))

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
  images: z.array(productImageSchema).max(30),
  // Opciones de lente que ofrece el modelo. Lista VACÍA = las ofrece todas
  // (ver axis_product_lens_option); ausente = no se toca lo que ya hubiera.
  lensOptionIds: z.array(z.string().uuid()).max(20).optional(),
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
  // 'lens' = un tipo de lente; 'prescription' = el complemento de fórmula;
  // 'coating' = el antirreflejo, que se monta sobre cualquier lente.
  kind: z.enum(['lens', 'prescription', 'coating']).default('lens'),
  nameEs: z.string().min(1).max(120),
  nameEn: z.string().min(1).max(120),
  descriptionEs: z.string().max(300).default(''),
  descriptionEn: z.string().max(300).default(''),
  extraPriceCop: z.number().int().min(0),
  // true = el precio se confirma después y no se cobra al pagar (fórmula
  // médica). Ausente = false, que es el comportamiento de siempre.
  priceOnQuote: z.boolean().default(false),
  // Precio del antirreflejo SOBRE ESTE LENTE. null = ya lo trae puesto.
  arExtraPriceCop: z.number().int().min(0).nullable().optional(),
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
