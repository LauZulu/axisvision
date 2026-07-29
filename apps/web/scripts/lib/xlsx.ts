import { readFileSync } from 'node:fs'
import { inflateRawSync } from 'node:zlib'

/**
 * Lector mínimo de .xlsx, sin dependencias.
 *
 * Un .xlsx es un ZIP con XML adentro. Solo necesitamos leer una hoja de valores
 * (el inventario), así que implementamos lo justo: descomprimir las entradas del
 * ZIP y extraer las celdas de `xl/worksheets/sheet1.xml` resolviendo la tabla de
 * cadenas compartidas. No soporta fórmulas, fechas ni formatos — para eso hay
 * librerías, pero traer una dependencia entera por un inventario de 130 filas no
 * se justifica.
 */

// ---------- ZIP ----------

type ZipEntries = Map<string, Buffer>

function readZip(buf: Buffer): ZipEntries {
  // El "End of Central Directory" está al final; puede llevar comentario, así
  // que se busca su firma hacia atrás.
  let eocd = -1
  for (let i = buf.length - 22; i >= 0 && i >= buf.length - 22 - 0xffff; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('xlsx: no es un ZIP válido (falta EOCD)')

  const count = buf.readUInt16LE(eocd + 10)
  let ptr = buf.readUInt32LE(eocd + 16)
  const entries: ZipEntries = new Map()

  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) throw new Error('xlsx: central directory corrupto')
    const method = buf.readUInt16LE(ptr + 10)
    const compressedSize = buf.readUInt32LE(ptr + 20)
    const nameLen = buf.readUInt16LE(ptr + 28)
    const extraLen = buf.readUInt16LE(ptr + 30)
    const commentLen = buf.readUInt16LE(ptr + 32)
    const localOffset = buf.readUInt32LE(ptr + 42)
    const name = buf.toString('utf8', ptr + 46, ptr + 46 + nameLen)

    // El local header repite nombre/extra con longitudes propias: hay que leer
    // las suyas, no las del central directory (el extra suele diferir).
    if (buf.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('xlsx: local header corrupto')
    const lNameLen = buf.readUInt16LE(localOffset + 26)
    const lExtraLen = buf.readUInt16LE(localOffset + 28)
    const start = localOffset + 30 + lNameLen + lExtraLen
    const raw = buf.subarray(start, start + compressedSize)

    entries.set(name, method === 0 ? raw : inflateRawSync(raw))
    ptr += 46 + nameLen + extraLen + commentLen
  }
  return entries
}

// ---------- XML ----------

const XML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
}

function decodeXml(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (whole, code: string) => {
    if (code.startsWith('#x') || code.startsWith('#X'))
      return String.fromCodePoint(parseInt(code.slice(2), 16))
    if (code.startsWith('#')) return String.fromCodePoint(Number(code.slice(1)))
    return XML_ENTITIES[code] ?? whole
  })
}

/** Concatena el texto de todos los <t> de un fragmento (una celda o un <si>). */
function textOf(fragment: string): string {
  let out = ''
  for (const m of fragment.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)) out += decodeXml(m[1])
  return out
}

function readSharedStrings(entries: ZipEntries): string[] {
  const xml = entries.get('xl/sharedStrings.xml')?.toString('utf8')
  if (!xml) return []
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]))
}

// ---------- API ----------

/** Una fila = columna ("A", "B"…) → valor de celda ya resuelto a string. */
export type SheetRow = Record<string, string>

/**
 * Lee la primera hoja de un .xlsx y devuelve sus filas no vacías, indexadas por
 * letra de columna. Los números vienen como string (sin formato aplicado).
 */
export function readSheet(path: string, sheet = 'xl/worksheets/sheet1.xml'): SheetRow[] {
  const entries = readZip(readFileSync(path))
  const xml = entries.get(sheet)?.toString('utf8')
  if (!xml) throw new Error(`xlsx: no existe la hoja "${sheet}" en ${path}`)

  const shared = readSharedStrings(entries)
  const rows: SheetRow[] = []

  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: SheetRow = {}
    // Celdas con contenido (<c …>…</c>) y vacías autocerradas (<c … />).
    for (const cell of rowMatch[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cell[1]
      const body = cell[2] ?? ''
      const ref = /\br="([A-Z]+)\d+"/.exec(attrs)?.[1]
      if (!ref) continue
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1]

      let value: string
      if (type === 'inlineStr') {
        value = textOf(body)
      } else {
        const raw = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body)?.[1]
        if (raw === undefined) continue
        value = type === 's' ? (shared[Number(raw)] ?? '') : decodeXml(raw)
      }

      value = value.trim()
      if (value !== '') row[ref] = value
    }
    if (Object.keys(row).length > 0) rows.push(row)
  }
  return rows
}
