import './_env'
import bcrypt from 'bcryptjs'
import type { DataSource } from 'typeorm'
import { buildDataSource } from '../src/server/db/data-source'
import { AxisProduct } from '../src/server/db/entities/Product'
import { AxisProductImage } from '../src/server/db/entities/ProductImage'
import { AxisUser } from '../src/server/db/entities/User'

let AppDataSource: DataSource

// Datos de prueba (modo test): los mismos 4 productos y copy que ya se mostraban,
// ahora como fuente de verdad en la DB. Imágenes por CLAVE (repetidas del repo).
const PRODUCTS = [
  {
    slug: 'axis-onyx',
    name: 'AXIS Onyx',
    taglineEs: 'Negro carbón mate. El clásico atemporal.',
    taglineEn: 'Matte carbon black. The timeless classic.',
    descriptionEs:
      'La edición esencial: montura en negro carbón mate y líneas sobrias que combinan con todo. Toda la inteligencia de AXIS en el acabado más discreto.',
    descriptionEn:
      'The essential edition: a matte carbon-black frame with clean lines that go with everything. All of AXIS’s intelligence in its most discreet finish.',
    priceCop: 1_190_000,
    stock: 12,
    position: 1,
    images: ['gafas-de-frente', 'hero-producto', 'modelo-01'],
  },
  {
    slug: 'axis-aurum',
    name: 'AXIS Aurum',
    taglineEs: 'Detalles en dorado antiguo. La edición insignia.',
    taglineEn: 'Antique gold accents. The flagship edition.',
    descriptionEs:
      'Acentos en dorado antiguo sobre carbón: la edición insignia para quien quiere que se note el detalle. Presencia sin estridencia.',
    descriptionEn:
      'Antique-gold accents over carbon: the flagship edition for those who want the detail to show. Presence without noise.',
    priceCop: 1_390_000,
    stock: 8,
    position: 2,
    images: ['hero-producto-02', 'modelo-03', 'cafe'],
  },
  {
    slug: 'axis-morpho',
    name: 'AXIS Morpho',
    taglineEs: 'Acabado iridiscente. Edición limitada de autor.',
    taglineEn: 'Iridescent finish. A limited signature edition.',
    descriptionEs:
      'Reflejo iridiscente Morpho, nuestra firma cromática, en una edición limitada de autor. La pieza más exclusiva del catálogo AXIS.',
    descriptionEn:
      'The iridescent Morpho sheen, our signature color, in a limited author edition. The most exclusive piece in the AXIS catalog.',
    priceCop: 1_690_000,
    stock: 4,
    position: 3,
    images: ['empaque-abierto', 'modelo-05', 'modelo-07'],
  },
  {
    slug: 'axis-clarum',
    name: 'AXIS Clarum',
    taglineEs: 'Lente clara translúcida. Ligera y luminosa.',
    taglineEn: 'Clear translucent lens. Light and luminous.',
    descriptionEs:
      'Montura translúcida y lente clara para el día a día luminoso. La edición más ligera y versátil, hecha para llevarse de la mañana a la noche.',
    descriptionEn:
      'A translucent frame and clear lens for bright, everyday wear. The lightest, most versatile edition, made to wear from morning to night.',
    priceCop: 1_290_000,
    stock: 10,
    position: 4,
    images: ['modelo-02', 'modelo-08', 'cafe-02'],
  },
]

async function seedProducts() {
  const productRepo = AppDataSource.getRepository(AxisProduct)
  const imageRepo = AppDataSource.getRepository(AxisProductImage)

  for (const data of PRODUCTS) {
    let product = await productRepo.findOne({ where: { slug: data.slug } })
    if (!product) {
      product = productRepo.create()
    }
    product.slug = data.slug
    product.name = data.name
    product.taglineEs = data.taglineEs
    product.taglineEn = data.taglineEn
    product.descriptionEs = data.descriptionEs
    product.descriptionEn = data.descriptionEn
    product.priceCop = data.priceCop
    product.currency = 'COP'
    product.stock = data.stock
    product.active = true
    product.position = data.position
    await productRepo.save(product)

    // Reemplaza las fotos por las del seed (idempotente).
    await imageRepo.delete({ productId: product.id })
    await imageRepo.save(
      data.images.map((imageKey, position) =>
        imageRepo.create({ productId: product!.id, imageKey, position }),
      ),
    )
    console.log(`  · ${data.slug} (stock ${data.stock}, ${data.images.length} fotos)`)
  }
}

async function seedAdmin() {
  const userRepo = AppDataSource.getRepository(AxisUser)
  const email = (process.env.ADMIN_EMAIL || 'admin@axisvision.co').toLowerCase()
  const password = process.env.ADMIN_PASSWORD || 'axis-admin-2026'

  const existing = await userRepo.findOne({ where: { email } })
  if (existing) {
    console.log(`  · admin ya existe: ${email} (sin cambios)`)
    return
  }
  const hashed = await bcrypt.hash(password, 10)
  await userRepo.save(userRepo.create({ email, password: hashed, name: 'AXIS Admin', role: 'admin' }))
  console.log(`  · admin creado: ${email}`)
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`    ⚠️  contraseña por defecto: "${password}" — CÁMBIALA (o define ADMIN_PASSWORD antes del seed)`)
  }
}

async function main() {
  AppDataSource = buildDataSource()
  await AppDataSource.initialize()
  console.log('Seed AXIS →')
  console.log('Productos:')
  await seedProducts()
  console.log('Admin:')
  await seedAdmin()
  await AppDataSource.destroy()
  console.log('✓ Seed completo')
}

main().catch((err) => {
  console.error('✗ Seed falló:', err instanceof Error ? err.message : err)
  process.exit(1)
})
