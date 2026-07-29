import './_env'
import 'reflect-metadata'
import { resolve } from 'node:path'
import type { DataSource } from 'typeorm'
import { buildDataSource } from '../src/server/db/data-source'
import { AxisProduct } from '../src/server/db/entities/Product'
import { AxisProductImage } from '../src/server/db/entities/ProductImage'
import { AxisProductUnit } from '../src/server/db/entities/ProductUnit'
import type { UnitLensType, UnitLocation } from '../src/server/db/entities/ProductUnit'
import { AxisLensOption } from '../src/server/db/entities/LensOption'
import { syncStockFromUnits } from '../src/server/inventory'
import { readSheet } from './lib/xlsx'

/**
 * Carga el inventario real (Excel del cliente) en la base de datos.
 *
 *   pnpm inventory:import [ruta/al/inventario.xlsx] [--dry]
 *
 * Es IDEMPOTENTE y reejecutable: hace upsert por `modelCode` (productos) y por
 * `code` (unidades: AX01…), y al final deriva `stock` del conteo de unidades
 * disponibles. Volver a correrlo tras actualizar el Excel sincroniza los cambios
 * (incluye BORRAR las unidades que ya no aparezcan en el archivo).
 *
 * Con `--dry` no escribe nada: solo imprime lo que haría.
 */

// ---------- Configuración de negocio ----------

const DEFAULT_XLSX = resolve(
  import.meta.dirname,
  '../../../AXIS-AI-GLASSES-INVENTARIO-28-JUL-2026.xlsx',
)

/** Columnas del Excel de inventario (fila 2 = encabezados, datos desde la 3). */
const COL = { id: 'A', brand: 'B', model: 'C', unit: 'D', name: 'E', lens: 'F', state: 'G', note: 'H' }

/** Columna G del Excel → ubicación física. */
const LOCATION_BY_STATE: Record<string, UnitLocation> = {
  '0': 'fds',
  '1': 'casa',
  '2': 'local',
  '3': 'sold',
}

/**
 * Catálogo, por código de modelo. El Excel no trae precio ni copy: eso vive aquí
 * y es la fuente de verdad de la carga inicial. Después, el panel admin manda.
 *
 * Precios en COP. `compareAtPriceCop` es el precio de lista que se muestra
 * tachado; el cobro siempre es `priceCop`.
 */
const CATALOG = [
  {
    modelCode: 'M02',
    slug: 'axis-origin',
    name: 'AXIS Origin',
    size: 'grande' as const,
    priceCop: 1_400_000,
    compareAtPriceCop: 1_790_000,
    position: 1,
    taglineEs: 'El origen de una nueva forma de ver.',
    taglineEn: 'The origin of a new way of seeing.',
    descriptionEs:
      'El modelo que define a AXIS. Armazón grande de líneas limpias, lente de sol polarizado y la inteligencia artificial integrada que traduce, describe y acompaña sin que tengas que sacar el teléfono.',
    descriptionEn:
      'The model that defines AXIS. A large frame with clean lines, polarized sun lenses and integrated artificial intelligence that translates, describes and assists without ever reaching for your phone.',
  },
  {
    modelCode: 'AIMB-G5',
    slug: 'axis-apex',
    name: 'AXIS Apex',
    size: 'grande' as const,
    priceCop: 1_400_000,
    compareAtPriceCop: 1_790_000,
    position: 2,
    taglineEs: 'Presencia sin esfuerzo.',
    taglineEn: 'Effortless presence.',
    descriptionEs:
      'Armazón grande de carácter marcado, pensado para quien lleva la tecnología puesta sin anunciarla. Lente de sol polarizado y la misma inteligencia que hace de AXIS un compañero, no un aparato.',
    descriptionEn:
      'A large frame with strong character, made for those who wear technology without announcing it. Polarized sun lenses and the same intelligence that makes AXIS a companion, not a device.',
  },
  {
    modelCode: 'HK01',
    slug: 'axis-crystal',
    name: 'AXIS Crystal',
    size: 'mediano' as const,
    priceCop: 1_320_000,
    compareAtPriceCop: 1_690_000,
    position: 3,
    taglineEs: 'Claridad en cada detalle.',
    taglineEn: 'Clarity in every detail.',
    descriptionEs:
      'Talla mediana, proporción equilibrada y acabado nítido. Lente de sol polarizado y asistencia por voz para leer, traducir y reconocer lo que tienes enfrente.',
    descriptionEn:
      'Medium size, balanced proportions and a crisp finish. Polarized sun lenses and voice assistance to read, translate and recognise whatever is in front of you.',
  },
  {
    modelCode: 'E03L',
    slug: 'axis-shadow',
    name: 'AXIS Shadow',
    size: 'chico' as const,
    priceCop: 1_100_000,
    compareAtPriceCop: 1_490_000,
    position: 4,
    taglineEs: 'Discreción absoluta.',
    taglineEn: 'Absolute discretion.',
    descriptionEs:
      'Armazón chico y perfil bajo: pasa desapercibido y hace todo. Lente de sol polarizado, audio abierto y la inteligencia AXIS al alcance de la voz.',
    descriptionEn:
      'A small frame with a low profile: it goes unnoticed and does everything. Polarized sun lenses, open audio and AXIS intelligence a word away.',
  },
  {
    modelCode: 'E03S',
    slug: 'axis-ocean',
    name: 'AXIS Ocean',
    size: 'chico' as const,
    priceCop: 1_100_000,
    compareAtPriceCop: 1_490_000,
    position: 5,
    taglineEs: 'Hecho para la luz.',
    taglineEn: 'Made for the light.',
    descriptionEs:
      'Armazón chico pensado para el exterior. El lente de sol polarizado corta el reflejo del agua y del asfalto mientras la inteligencia AXIS describe, traduce y responde.',
    descriptionEn:
      'A small frame made for the outdoors. Polarized sun lenses cut glare off water and asphalt while AXIS intelligence describes, translates and answers.',
  },
  {
    modelCode: 'M01PRO',
    slug: 'axis-eclypse',
    name: 'AXIS Eclypse',
    size: 'chico' as const,
    priceCop: 1_100_000,
    compareAtPriceCop: 1_490_000,
    position: 6,
    taglineEs: 'La luz, bajo control.',
    taglineEn: 'Light, under control.',
    descriptionEs:
      'Armazón chico de líneas cerradas y acabado profundo. Lente de sol polarizado y la inteligencia AXIS integrada para acompañarte todo el día.',
    descriptionEn:
      'A small frame with tight lines and a deep finish. Polarized sun lenses and integrated AXIS intelligence to accompany you all day.',
  },
]

/**
 * Opciones de lente. Las gafas salen de fábrica con sol polarizado (incluido);
 * el resto son personalizaciones que se montan con la óptica aliada y cuestan
 * +$10.000 cada una (precio provisional, se ajusta desde el panel admin).
 *
 * En un reimport NO se pisan `extraPriceCop` ni `active` de las opciones que ya
 * existen (para respetar lo que el admin haya configurado); usa `--reset-lenses`
 * si quieres forzar los valores de este archivo.
 */
const LENS_OPTIONS = [
  {
    slug: 'sol-polarizado',
    nameEs: 'Lente de sol polarizado',
    nameEn: 'Polarized sun lens',
    descriptionEs: 'El lente con el que vienen tus AXIS. Corta el reflejo y protege del sol.',
    descriptionEn: 'The lens your AXIS ships with. Cuts glare and protects from the sun.',
    extraPriceCop: 0,
    requiresPrescription: false,
    isDefault: true,
    active: true,
    position: 1,
  },
  {
    slug: 'formula-medica',
    nameEs: 'Lente con tu fórmula',
    nameEn: 'Prescription lens',
    descriptionEs: 'Montamos tu fórmula con nuestra óptica aliada. Nos la envías después de comprar.',
    descriptionEn: 'We fit your prescription with our partner optician. You send it after purchase.',
    extraPriceCop: 10_000,
    requiresPrescription: true,
    isDefault: false,
    active: true,
    position: 2,
  },
  {
    slug: 'transitions',
    nameEs: 'Transitions (fotocromático)',
    nameEn: 'Transitions (photochromic)',
    descriptionEs: 'Se oscurece con el sol y se aclara en interiores. Disponible con o sin fórmula.',
    descriptionEn: 'Darkens in the sun, clears indoors. Available with or without prescription.',
    extraPriceCop: 10_000,
    requiresPrescription: false,
    isDefault: false,
    active: true,
    position: 3,
  },
  {
    slug: 'filtro-azul',
    nameEs: 'Filtro de luz azul',
    nameEn: 'Blue light filter',
    descriptionEs: 'Lente transparente con filtro para pantallas. Para uso en interiores.',
    descriptionEn: 'Clear lens with a screen filter. For indoor use.',
    extraPriceCop: 10_000,
    requiresPrescription: false,
    isDefault: false,
    active: true,
    position: 4,
  },
  {
    slug: 'filtro-amarillo',
    nameEs: 'Filtro amarillo',
    nameEn: 'Yellow filter',
    descriptionEs: 'Mejora el contraste con poca luz: conducción nocturna y días nublados.',
    descriptionEn: 'Boosts contrast in low light: night driving and overcast days.',
    extraPriceCop: 10_000,
    requiresPrescription: false,
    isDefault: false,
    active: true,
    position: 5,
  },
  {
    slug: 'transparente',
    nameEs: 'Lente transparente sin fórmula',
    nameEn: 'Clear lens, no prescription',
    descriptionEs: 'Para llevar AXIS todo el día sin filtro de sol.',
    descriptionEn: 'To wear AXIS all day without a sun filter.',
    extraPriceCop: 10_000,
    requiresPrescription: false,
    isDefault: false,
    active: true,
    position: 6,
  },
]

// ---------- Lectura del Excel ----------

type InventoryRow = {
  code: string
  modelCode: string
  unitNumber: number
  lensType: UnitLensType
  location: UnitLocation
  note: string | null
}

function parseInventory(path: string): InventoryRow[] {
  const rows = readSheet(path)
  const out: InventoryRow[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    const code = row[COL.id]
    // Salta encabezados y filas sueltas: solo cuentan las que traen serial AXnn.
    if (!code || !/^AX\d+$/i.test(code)) continue
    if (seen.has(code)) throw new Error(`Inventario: serial duplicado "${code}"`)
    seen.add(code)

    const modelCode = row[COL.model]
    if (!modelCode) throw new Error(`Inventario: "${code}" no tiene modelo`)

    const location = LOCATION_BY_STATE[row[COL.state] ?? '']
    if (!location)
      throw new Error(`Inventario: "${code}" tiene estado desconocido "${row[COL.state]}"`)

    // El tipo de lente NO se toma de la columna "Tipo Lente" (dice "Sunglass" en
    // todas las filas, incluidas las oftálmicas): el dato real es el sufijo "/O"
    // del nombre, que marca lente transparente.
    const lensType: UnitLensType = /\/O$/i.test(row[COL.name] ?? '')
      ? 'ophthalmic'
      : 'sunglass_polarized'

    out.push({
      code: code.toUpperCase(),
      modelCode,
      unitNumber: Number(row[COL.unit]),
      lensType,
      location,
      note: row[COL.note] ?? null,
    })
  }
  return out
}

// ---------- Carga ----------

const DRY = process.argv.includes('--dry')
/** Fuerza precio y visibilidad de las opciones de lente a los valores de este archivo. */
const RESET_LENSES = process.argv.includes('--reset-lenses')
const xlsxPath = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? DEFAULT_XLSX

let db: DataSource

async function main() {
  const inventory = parseInventory(xlsxPath)
  console.log(`Inventario: ${inventory.length} unidades leídas de ${xlsxPath}`)

  const known = new Set(CATALOG.map((p) => p.modelCode))
  const unknown = [...new Set(inventory.map((u) => u.modelCode))].filter((m) => !known.has(m))
  if (unknown.length)
    throw new Error(
      `El inventario trae modelos que no están en el catálogo del script: ${unknown.join(', ')}. ` +
        `Añádelos a CATALOG (con precio y copy) antes de importar.`,
    )

  if (DRY) {
    console.log('\n--dry: no se escribe nada. Resumen de lo que se cargaría:\n')
    for (const p of CATALOG) {
      const units = inventory.filter((u) => u.modelCode === p.modelCode)
      const sellable = units.filter(
        (u) => u.lensType === 'sunglass_polarized' && (u.location === 'casa' || u.location === 'local'),
      ).length
      console.log(
        `  ${p.name.padEnd(14)} ${p.modelCode.padEnd(9)} ${units.length
          .toString()
          .padStart(3)} unidades → stock ${sellable}`,
      )
    }
    return
  }

  db = buildDataSource()
  await db.initialize()

  await db.transaction(async (m) => {
    // --- 1. Productos ficticios del seed: fuera del catálogo ---
    // Se conserva el mapa slug→imageKey para reasignar las fotos (los objetos en
    // S3 NO se tocan: borrar filas de axis_product_image no borra nada del bucket).
    const legacy = await m.find(AxisProduct, { relations: { images: true } })
    const catalogSlugs = new Set(CATALOG.map((p) => p.slug))
    const toRemove = legacy.filter((p) => !catalogSlugs.has(p.slug))
    const rescuedKeys = toRemove
      .flatMap((p) => (p.images ?? []).slice().sort((a, b) => a.position - b.position))
      .map((i) => i.imageKey)

    if (toRemove.length) {
      // axis_order_item.productId no tiene FK y guarda snapshot de nombre/precio,
      // así que el historial de pedidos sobrevive al borrado.
      await m.remove(toRemove)
      console.log(
        `Productos del seed eliminados: ${toRemove.map((p) => p.slug).join(', ')} ` +
          `(${rescuedKeys.length} fotos rescatadas para reasignar)`,
      )
    }

    // --- 2. Catálogo real (upsert por modelCode) ---
    const productByModel = new Map<string, AxisProduct>()
    for (const data of CATALOG) {
      let product = await m.findOne(AxisProduct, { where: { modelCode: data.modelCode } })
      if (!product) product = await m.findOne(AxisProduct, { where: { slug: data.slug } })

      if (product) {
        m.merge(AxisProduct, product, data)
      } else {
        product = m.create(AxisProduct, { ...data, brand: 'AXIS', currency: 'COP', active: true })
      }
      product.active = true
      await m.save(product)
      productByModel.set(data.modelCode, product)
      console.log(`  · ${data.name} (${data.modelCode}) $${data.priceCop.toLocaleString('es-CO')}`)
    }

    // --- 3. Fotos rescatadas: repartidas entre los productos sin fotos ---
    // Provisional para que la tienda no se vea vacía; el admin sube las reales.
    if (rescuedKeys.length) {
      const needy: AxisProduct[] = []
      for (const p of productByModel.values()) {
        const count = await m.count(AxisProductImage, { where: { productId: p.id } })
        if (count === 0) needy.push(p)
      }
      if (needy.length) {
        const perProduct = Math.max(1, Math.floor(rescuedKeys.length / needy.length))
        let cursor = 0
        for (const p of needy) {
          const slice = rescuedKeys.slice(cursor, cursor + perProduct)
          cursor += perProduct
          for (const [position, imageKey] of slice.entries()) {
            await m.save(m.create(AxisProductImage, { productId: p.id, imageKey, position }))
          }
        }
        console.log(`  · ${rescuedKeys.length} fotos reasignadas entre ${needy.length} productos`)
      }
    }

    // --- 4. Unidades físicas (upsert por code, y borra las que ya no estén) ---
    const codes = new Set(inventory.map((u) => u.code))
    const existing = await m.find(AxisProductUnit)
    const stale = existing.filter((u) => !codes.has(u.code))
    if (stale.length) {
      await m.remove(stale)
      console.log(`  · ${stale.length} unidades ya no están en el Excel → eliminadas`)
    }

    const byCode = new Map(existing.map((u) => [u.code, u]))
    let created = 0
    let updated = 0
    for (const row of inventory) {
      const product = productByModel.get(row.modelCode)!
      // Las oftálmicas son muestra: se registran pero no cuentan como stock.
      const fields = {
        productId: product.id,
        unitNumber: row.unitNumber,
        lensType: row.lensType,
        location: row.location,
        sellable: row.lensType === 'sunglass_polarized',
        note: row.note,
      }
      const found = byCode.get(row.code)
      if (found) {
        m.merge(AxisProductUnit, found, fields)
        await m.save(found)
        updated++
      } else {
        await m.save(m.create(AxisProductUnit, { code: row.code, ...fields }))
        created++
      }
    }
    console.log(`Unidades: ${created} creadas, ${updated} actualizadas`)

    // --- 5. Opciones de lente (upsert por slug, respeta precios ya editados) ---
    for (const opt of LENS_OPTIONS) {
      const found = await m.findOne(AxisLensOption, { where: { slug: opt.slug } })
      if (found) {
        // Por defecto no se pisa lo que el admin haya configurado (precio y
        // visibilidad): solo se refrescan los textos.
        m.merge(AxisLensOption, found, {
          nameEs: opt.nameEs,
          nameEn: opt.nameEn,
          descriptionEs: opt.descriptionEs,
          descriptionEn: opt.descriptionEn,
          requiresPrescription: opt.requiresPrescription,
          isDefault: opt.isDefault,
          position: opt.position,
          ...(RESET_LENSES ? { extraPriceCop: opt.extraPriceCop, active: opt.active } : {}),
        })
        await m.save(found)
      } else {
        await m.save(m.create(AxisLensOption, opt))
      }
    }
    console.log(`Opciones de lente: ${LENS_OPTIONS.length} sincronizadas`)

    // --- 6. Stock derivado del conteo de unidades ---
    const stocks = await syncStockFromUnits(m)
    for (const [modelCode, product] of productByModel) {
      console.log(`  · ${modelCode.padEnd(9)} stock = ${stocks.get(product.id) ?? 0}`)
    }
  })

  console.log('\nListo.')
}

main()
  .catch((err) => {
    console.error('\nFalló la importación:', err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(async () => {
    if (db?.isInitialized) await db.destroy()
  })
