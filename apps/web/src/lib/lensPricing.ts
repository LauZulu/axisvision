/**
 * Qué cuesta un lente CON la fórmula del cliente — el árbol de decisión del
 * precio.
 *
 * Hasta ahora la graduación no tenía precio: la fila `prescription` iba con
 * `priceOnQuote` y el montaje se cotizaba por WhatsApp después de comprar. Eso
 * funcionaba porque la fórmula llegaba después; con el formulario de la ficha
 * llega ANTES, así que ya se puede decir el número en la página, que es lo que
 * hace que la persona termine la compra en vez de esperar una respuesta.
 *
 * El árbol tiene tres nodos y se recorre en este orden:
 *
 *   1. POTENCIA → ÍNDICE. Lo decide `requiredIndex()` (tabla `INDEX_TIERS` en
 *      prescription.ts). Un −5.50 no se puede tallar en el mismo material que
 *      un −0.75.
 *   2. (LENTE × TIPO DE RX × ÍNDICE) → ¿hay fila en la lista? Si el
 *      laboratorio nos dio ese precio, manda esa fila y no se calcula nada.
 *   3. Si no hay fila → FÓRMULA GENÉRICA: el precio del plano escalado por el
 *      índice y por el tipo de graduación.
 *
 * **El paso 3 existe porque el algoritmo real todavía no está definido** (la
 * lista de tallados no la tenemos: está anotado en PENDIENTES.md). La fórmula
 * genérica da siempre un número —la tienda nunca se queda sin precio que
 * mostrar— y marca el resultado como `estimated`, que es lo que hace que la
 * ficha añada "sujeto a confirmación". A medida que se carguen filas reales en
 * `/admin/lentes`, esos casos dejan de estimarse solos: no hay que tocar código
 * para cambiar de un mundo al otro.
 *
 * Módulo PURO: la ficha cotiza en vivo con estas mismas funciones, pero lo que
 * se COBRA lo recalcula siempre el servidor (`src/server/lensPricing.ts`) con
 * las filas de la DB. Aquí no se confía en nada que venga del navegador.
 */
import type { LensOptionDTO } from './lenses'
import { requiredIndex, type LensIndex, type Prescription, type RxType } from './prescription'

/**
 * Lo único que el motor necesita saber de un lente. Es un subconjunto
 * estructural del DTO a propósito: así el servidor puede pasarle la ENTIDAD de
 * TypeORM tal cual, sin construir un DTO intermedio solo para cotizar.
 */
export type PriceableLens = Pick<
  LensOptionDTO,
  'id' | 'slug' | 'extraPriceCop' | 'priceOnQuote' | 'arExtraPriceCop'
>

/**
 * Precio de un lente graduado concreto, tal como lo da el laboratorio.
 * Es el nivel de detalle mínimo con el que se puede cobrar sin inventar: el
 * mismo lente vale distinto en monofocal y en progresiva, y distinto en cada
 * índice.
 */
export type RxPriceDTO = {
  id: string
  lensOptionId: string
  rxType: RxType
  lensIndex: LensIndex
  /** Precio TOTAL del lente graduado (no un recargo sobre el plano). */
  priceCop: number
  /**
   * Qué cuesta el antirreflejo SOBRE este lente graduado. `null` = ya lo trae
   * puesto, igual que en `axis_lens_option.arExtraPriceCop`.
   */
  arExtraPriceCop: number | null
}

/**
 * Los coeficientes de la fórmula genérica. Viven aquí, en un solo objeto y con
 * nombre, para que el día que llegue el algoritmo de verdad se cambien en un
 * sitio — o se sustituya `estimateRxPrice()` entera sin tocar a quien la llama.
 */
export type PricingRules = {
  /** Cuánto encarece cada índice respecto del material básico. */
  indexFactor: Record<LensIndex, number>
  /** Cuánto encarece el tipo de graduación. La progresiva es otro tallado. */
  rxTypeFactor: Record<RxType, number>
  /**
   * Lo que cuesta tallar el lente más simple. Es el suelo del cálculo: el
   * polarizado va INCLUIDO con la montura (`extraPriceCop: 0`), pero graduarlo
   * no es gratis — sin este suelo, unas gafas de sol con fórmula saldrían al
   * precio de unas sin ella.
   */
  baseCop: number
  /** Los precios se redondean a este múltiplo. Nadie cotiza en 143.750. */
  roundToCop: number
}

/**
 * Valores de partida, deliberadamente conservadores y redondos.
 *
 * NO salen de la lista del laboratorio (esa solo tiene terminados 1,5): son la
 * pendiente habitual del mercado. Están para que la tienda pueda dar una cifra
 * mientras se define la real, no para pasar a producción sin revisar.
 */
export const DEFAULT_PRICING_RULES: PricingRules = {
  indexFactor: { '1.50': 1, '1.56': 1.25, '1.60': 1.6, '1.67': 2.2, '1.74': 3 },
  rxTypeFactor: { single: 1, progressive: 2.4 },
  baseCop: 90_000,
  roundToCop: 1_000,
}

/** El desglose completo de una configuración de lente. */
export type LensQuote = {
  /**
   * Parte del precio que corresponde al lente SIN graduar. Es lo que se
   * seguiría cobrando si la persona quitara la fórmula, y lo que va al
   * snapshot en `lensExtraPriceCop`.
   */
  lensBaseCop: number
  /** Sobrecosto de tallarlo con la fórmula (0 si va sin ella). */
  rxDeltaCop: number
  /** Lo que cuesta el antirreflejo sobre ESE lente (0 si no lo lleva o si va incluido). */
  coatingCop: number
  /** true = el lente elegido ya trae el antirreflejo puesto. */
  coatingIncluded: boolean
  /** Todo lo que se suma al precio de la montura. */
  extraCop: number
  /** Índice aplicado. null = la línea va sin fórmula. */
  index: LensIndex | null
  rxType: RxType | null
  /** De dónde salió el número: sin fórmula, de la lista, o estimado. */
  source: 'plano' | 'table' | 'estimate'
  /**
   * true = el precio lo puso la fórmula genérica, no el laboratorio. La tienda
   * lo muestra igual, pero con la advertencia de que se confirma al revisar la
   * fórmula. Es la diferencia entre un precio y una estimación, y callarla
   * sería prometer un valor que nadie ha aprobado.
   */
  estimated: boolean
  /** El camino que recorrió el árbol, legible. Para el panel y para depurar. */
  trace: string[]
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step

/** Índice de las filas de precio: (lente, tipo de rx, índice) → fila. */
function rxPriceKey(lensOptionId: string, rxType: RxType, index: LensIndex): string {
  return `${lensOptionId}|${rxType}|${index}`
}

export function indexRxPrices(rows: RxPriceDTO[]): Map<string, RxPriceDTO> {
  return new Map(rows.map((r) => [rxPriceKey(r.lensOptionId, r.rxType, r.lensIndex), r]))
}

/**
 * Precio del lente graduado cuando el laboratorio no nos ha dado ese renglón.
 *
 * Es el nodo 3 del árbol y el único sitio donde se inventa un número. Se deja
 * en una función suelta y exportada para poder sustituirla de un plumazo
 * cuando llegue el algoritmo real, sin tocar a `quoteLens()`.
 */
export function estimateRxPrice(
  planoCop: number,
  index: LensIndex,
  rxType: RxType,
  rules: PricingRules = DEFAULT_PRICING_RULES,
): number {
  const base = Math.max(planoCop, rules.baseCop)
  return roundTo(base * rules.indexFactor[index] * rules.rxTypeFactor[rxType], rules.roundToCop)
}

/**
 * Cotiza una configuración completa: lente + antirreflejo + fórmula.
 *
 * `rx` en null es el caso de siempre (sin graduación) y se comporta
 * exactamente como antes de esta función existiera: el plano de
 * `extraPriceCop` y el antirreflejo de `arExtraPriceCop`.
 */
export function quoteLens({
  lens,
  withCoating,
  rx,
  prices,
  rules = DEFAULT_PRICING_RULES,
}: {
  lens: PriceableLens | null
  withCoating: boolean
  /** La fórmula del cliente, o null si compra sin graduación. */
  rx: Prescription | null
  /** Filas de precio graduado conocidas (de la DB). */
  prices: Map<string, RxPriceDTO>
  rules?: PricingRules
}): LensQuote {
  const trace: string[] = []
  // Un lente "por confirmar" no cobra nada por sí mismo: ese es el sentido de
  // la bandera en toda la tienda (ver `lensExtraCop`).
  const planoCop = !lens || lens.priceOnQuote ? 0 : lens.extraPriceCop
  const coatingIncluded = Boolean(lens && lens.arExtraPriceCop === null)
  const planoArCop = lens?.arExtraPriceCop ?? 0

  if (!rx || !lens) {
    const coatingCop = withCoating && !coatingIncluded ? planoArCop : 0
    trace.push('Sin fórmula: precio de lente terminado.')
    return {
      lensBaseCop: planoCop,
      rxDeltaCop: 0,
      coatingCop,
      coatingIncluded,
      extraCop: planoCop + coatingCop,
      index: null,
      rxType: null,
      source: 'plano',
      estimated: false,
      trace,
    }
  }

  const index = requiredIndex(rx)
  const rxType = rx.rxType
  trace.push(
    `Potencia máxima ${Math.max(0, Number(maxPowerOf(rx).toFixed(2)))} D → índice ${index}.`,
  )

  const row = prices.get(rxPriceKey(lens.id, rxType, index))
  let lensCop: number
  let estimated: boolean
  if (row) {
    lensCop = row.priceCop
    estimated = false
    trace.push(`Precio de lista para ${lens.slug} ${labelRxType(rxType)} ${index}.`)
  } else {
    lensCop = estimateRxPrice(planoCop, index, rxType, rules)
    estimated = true
    trace.push(
      `Sin renglón en la lista: estimado como ${Math.max(planoCop, rules.baseCop).toLocaleString('es-CO')} × ${rules.indexFactor[index]} (índice) × ${rules.rxTypeFactor[rxType]} (${labelRxType(rxType)}).`,
    )
  }

  // El antirreflejo sobre un lente graduado: si la fila trae el suyo, ese; si
  // no, el del plano escalado por el índice — el tratamiento se aplica sobre
  // una superficie más cara, y en la lista 2026 tampoco cuesta lo mismo sobre
  // cada material. El `null` conserva su significado: ya lo trae puesto.
  const rowArIncluded = row ? row.arExtraPriceCop === null : coatingIncluded
  let coatingCop = 0
  if (withCoating && !rowArIncluded) {
    coatingCop = row
      ? row.arExtraPriceCop!
      : roundTo(planoArCop * rules.indexFactor[index], rules.roundToCop)
    trace.push(`Antirreflejo: ${coatingCop.toLocaleString('es-CO')}.`)
  } else if (rowArIncluded) {
    trace.push('Antirreflejo incluido en este lente.')
  }

  // El delta nunca puede salir negativo: si la lista pusiera el graduado por
  // debajo del terminado, se cobra el graduado entero como base y el delta
  // queda en cero. El total es el mismo; lo que se evita es un comprobante con
  // un "+ −30.000" que nadie sabe leer.
  const lensBaseCop = Math.min(planoCop, lensCop)
  const rxDeltaCop = lensCop - lensBaseCop

  return {
    lensBaseCop,
    rxDeltaCop,
    coatingCop,
    coatingIncluded: rowArIncluded,
    extraCop: lensCop + coatingCop,
    index,
    rxType,
    source: row ? 'table' : 'estimate',
    estimated,
    trace,
  }
}

// Se reexporta con otro nombre para no arrastrar a quien importe este módulo a
// tener que conocer prescription.ts solo por la traza.
function maxPowerOf(rx: Prescription): number {
  const eye = (e: { sph: number; cyl: number }) =>
    Math.max(Math.abs(e.sph), Math.abs(e.sph + e.cyl))
  return Math.max(eye(rx.od), eye(rx.os))
}

export function labelRxType(rxType: RxType): string {
  return rxType === 'progressive' ? 'progresiva' : 'monofocal'
}
