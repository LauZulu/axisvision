/**
 * La fórmula médica como DATO, no como párrafo.
 *
 * Hasta ahora la graduación viajaba en un `textarea` del checkout
 * (`prescriptionNote`): servía para reenviársela al laboratorio, pero no se
 * podía *calcular* nada con ella. Y el precio de un lente graduado depende
 * justamente de eso — de la potencia, que decide el índice de refracción, que
 * decide cuánto cuesta tallarlo. Con texto libre no hay forma de cotizar en la
 * página; con esto sí.
 *
 * Módulo PURO (sin imports de servidor) a propósito: es el mismo archivo que
 * valida el formulario del navegador y el que revalida el servidor antes de
 * cobrar. Duplicar la regla en dos sitios acaba siempre en un campo que el
 * front acepta y el back rechaza — la misma razón por la que `phone.ts` es
 * compartido.
 *
 * Convención de signos: se guarda lo que dice la fórmula del optómetra, con
 * signo. La esfera puede ser negativa (miopía) o positiva (hipermetropía); el
 * cilindro se pide en notación NEGATIVA (la que usan los laboratorios en
 * Colombia), y la adición es siempre positiva.
 */

/** Monofocal o progresiva. Cambia el precio y qué campos se piden. */
export type RxType = 'single' | 'progressive'

/**
 * Índice de refracción del material. A más potencia, más alto el índice
 * (lente más delgado) y más caro. NO lo elige el cliente: se deriva de su
 * graduación con `requiredIndex()`.
 */
export type LensIndex = '1.50' | '1.56' | '1.60' | '1.67' | '1.74'

export const LENS_INDEXES: LensIndex[] = ['1.50', '1.56', '1.60', '1.67', '1.74']

/** Un ojo de la fórmula. */
export type EyeRx = {
  /** Esfera en dioptrías, con signo. 0 = sin defecto esférico. */
  sph: number
  /** Cilindro en dioptrías, notación negativa. 0 = sin astigmatismo. */
  cyl: number
  /** Eje en grados (0–180). Obligatorio si hay cilindro; si no, null. */
  axis: number | null
  /** Adición para cerca. Solo en progresivas. */
  add: number | null
}

export type Prescription = {
  rxType: RxType
  /** Ojo derecho. */
  od: EyeRx
  /** Ojo izquierdo. */
  os: EyeRx
  /**
   * Distancia interpupilar en mm. Un solo valor (la total) o uno por ojo
   * (monocular) cuando la persona los tiene distintos — Meta lo resuelve con
   * una casilla y aquí igual, porque una DIP monocular mal repartida descentra
   * el lente y el cliente ve mal con unas gafas nuevas y correctas.
   */
  pd: number | null
  pdOd: number | null
  pdOs: number | null
}

// ---------- Listas de valores (las que se pintan en los selects) ----------

/** Genera un rango de dioptrías inclusive, en pasos de 0.25. */
function steps(from: number, to: number, step = 0.25): number[] {
  const out: number[] = []
  // Se acumula con enteros (×100) para no arrastrar el error del binario:
  // 0.1 + 0.2 !== 0.3, y aquí eso significa un select con "1.7500000000000002".
  const f = Math.round(from * 100)
  const t = Math.round(to * 100)
  const s = Math.round(step * 100)
  for (let v = f; v <= t; v += s) out.push(v / 100)
  return out
}

/** Esfera: de −12.00 a +8.00. Fuera de ese rango es fórmula especial → cita. */
export const SPH_VALUES = steps(-12, 8)
/** Cilindro en notación negativa, de −6.00 a 0. */
export const CYL_VALUES = steps(-6, 0)
/** Adición (solo progresivas). */
export const ADD_VALUES = steps(0.75, 3.5)
/** DIP total, en mm. */
export const PD_VALUES = steps(48, 78, 0.5)
/** DIP monocular (por ojo): aproximadamente la mitad. */
export const PD_MONO_VALUES = steps(24, 39, 0.5)

export const AXIS_MIN = 0
export const AXIS_MAX = 180

/** Una fórmula vacía, la que abre el formulario. */
export function emptyPrescription(rxType: RxType = 'single'): Prescription {
  const eye: EyeRx = { sph: 0, cyl: 0, axis: null, add: null }
  return { rxType, od: { ...eye }, os: { ...eye }, pd: null, pdOd: null, pdOs: null }
}

// ---------- Potencia e índice ----------

/**
 * Potencia del meridiano más fuerte de un ojo.
 *
 * Con cilindro negativo, un lente tórico tiene dos potencias: la esfera y
 * `esfera + cilindro`. La que manda para elegir el material es la mayor en
 * valor absoluto — un −1.00 −4.00 es tan grueso como un −5.00, y cobrarlo como
 * si fuera un −1.00 sería regalar el lente.
 */
export function eyePower(eye: EyeRx): number {
  return Math.max(Math.abs(eye.sph), Math.abs(eye.sph + eye.cyl))
}

/** La potencia que manda en el par: la del ojo más cargado. */
export function maxPower(rx: Prescription): number {
  return Math.max(eyePower(rx.od), eyePower(rx.os))
}

/**
 * Tramos de potencia → índice. Es el primer nodo del árbol de decisión del
 * precio, y está aquí como TABLA (y no como una escalera de `if`) para poder
 * moverlo cuando el laboratorio confirme sus cortes reales.
 *
 * Son los cortes habituales del mercado: hasta ±2.00 el material básico basta;
 * de ahí para arriba se sube de índice para que el lente no quede de fondo de
 * botella.
 */
export const INDEX_TIERS: { upTo: number; index: LensIndex }[] = [
  { upTo: 2, index: '1.50' },
  { upTo: 4, index: '1.56' },
  { upTo: 6, index: '1.60' },
  { upTo: 8, index: '1.67' },
  { upTo: Infinity, index: '1.74' },
]

/** El índice que pide esta fórmula. Nunca lo elige el cliente. */
export function requiredIndex(rx: Prescription): LensIndex {
  const power = maxPower(rx)
  return INDEX_TIERS.find((t) => power <= t.upTo)?.index ?? '1.74'
}

/** true si la fórmula no tiene graduación en ningún ojo (todo en cero). */
export function isPlano(rx: Prescription): boolean {
  return maxPower(rx) === 0 && !rx.od.add && !rx.os.add
}

// ---------- Validación ----------

/** Qué campo está mal. La UI la usa para marcar en rojo el que toca. */
export type RxFieldError =
  | 'od.axis'
  | 'os.axis'
  | 'od.add'
  | 'os.add'
  | 'od.sph'
  | 'os.sph'
  | 'pd'
  | 'empty'

const inRange = (v: number, list: number[]) => v >= list[0] && v <= list[list.length - 1]

/**
 * Revisa la fórmula. Devuelve los campos que faltan o están fuera de rango.
 *
 * Se usa en los dos lados: el formulario deshabilita "Continuar" mientras haya
 * errores, y el servidor la vuelve a correr antes de cobrar — el endpoint es
 * público y nadie garantiza que la petición venga de nuestro navegador.
 */
export function validatePrescription(rx: Prescription): RxFieldError[] {
  const errors: RxFieldError[] = []

  for (const side of ['od', 'os'] as const) {
    const eye = rx[side]
    if (!inRange(eye.sph, SPH_VALUES)) errors.push(`${side}.sph`)
    // El eje solo tiene sentido con cilindro, pero con cilindro es obligatorio:
    // sin él el laboratorio no sabe en qué orientación tallar el astigmatismo.
    if (eye.cyl !== 0 && (eye.axis === null || eye.axis < AXIS_MIN || eye.axis > AXIS_MAX)) {
      errors.push(`${side}.axis`)
    }
    if (rx.rxType === 'progressive' && (eye.add === null || !inRange(eye.add, ADD_VALUES))) {
      errors.push(`${side}.add`)
    }
  }

  // DIP: o la total, o las dos monoculares. Una sola monocular no sirve.
  const hasMono = rx.pdOd !== null && rx.pdOs !== null
  const hasTotal = rx.pd !== null
  if (!hasMono && !hasTotal) errors.push('pd')
  if (hasMono && (!inRange(rx.pdOd!, PD_MONO_VALUES) || !inRange(rx.pdOs!, PD_MONO_VALUES))) {
    errors.push('pd')
  }
  if (!hasMono && hasTotal && !inRange(rx.pd!, PD_VALUES)) errors.push('pd')

  // Una fórmula toda en cero y sin adición no es una fórmula: quien marca "con
  // mi graduación" y no escribe nada acabaría pagando el sobrecosto de tallar
  // un lente que no hay que tallar.
  if (isPlano(rx)) errors.push('empty')

  return errors
}

// ---------- Presentación ----------

/** `-1.25` → `−1.25`; `0.75` → `+0.75`; `0` → `0.00`. Solo para mostrar. */
export function formatDiopter(value: number): string {
  const fixed = Math.abs(value).toFixed(2)
  if (value === 0) return '0.00'
  // Signo menos tipográfico (U+2212): el guion normal se parte de línea y en
  // una tabla de fórmula se lee como un separador.
  return value > 0 ? `+${fixed}` : `−${fixed}`
}

/** La DIP tal cual se escribe: `63` o `63.5`. */
export function formatPd(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/** Un ojo en una línea: `−1.25 −0.50 × 15`. */
export function describeEye(eye: EyeRx, rxType: RxType): string {
  const parts = [formatDiopter(eye.sph)]
  if (eye.cyl !== 0) {
    parts.push(formatDiopter(eye.cyl))
    if (eye.axis !== null) parts.push(`× ${eye.axis}°`)
  }
  if (rxType === 'progressive' && eye.add !== null) parts.push(`ADD ${formatDiopter(eye.add)}`)
  return parts.join(' ')
}

/**
 * La fórmula completa en texto plano — para el correo del pedido, el panel y
 * el snapshot del `prescriptionNote`. Es lo que lee la persona que manda a
 * tallar, así que va con etiquetas y no con posiciones.
 */
export function describePrescription(rx: Prescription): string {
  const lines = [
    rx.rxType === 'progressive' ? 'Progresivas' : 'Monofocales',
    `OD: ${describeEye(rx.od, rx.rxType)}`,
    `OI: ${describeEye(rx.os, rx.rxType)}`,
  ]
  if (rx.pdOd !== null && rx.pdOs !== null) {
    lines.push(`DIP: ${formatPd(rx.pdOd)} / ${formatPd(rx.pdOs)} mm (monocular)`)
  } else if (rx.pd !== null) {
    lines.push(`DIP: ${formatPd(rx.pd)} mm`)
  }
  lines.push(`Índice sugerido: ${requiredIndex(rx)}`)
  return lines.join('\n')
}

/** Resumen de una línea para el carrito y la ficha. */
export function summarizePrescription(rx: Prescription): string {
  const type = rx.rxType === 'progressive' ? 'Progresiva' : 'Monofocal'
  return `${type} · OD ${describeEye(rx.od, rx.rxType)} · OI ${describeEye(rx.os, rx.rxType)}`
}

/**
 * Huella estable de una fórmula, para identificar la línea del carrito.
 *
 * Dos pares del mismo modelo con graduaciones distintas son dos líneas, no una
 * de cantidad 2: se tallan distinto y valen distinto. Sin esto, `lineId()` los
 * fundiría y el segundo par saldría con la fórmula del primero.
 */
export function prescriptionKey(rx: Prescription): string {
  const eye = (e: EyeRx) => `${e.sph}/${e.cyl}/${e.axis ?? '-'}/${e.add ?? '-'}`
  return [rx.rxType, eye(rx.od), eye(rx.os), rx.pd ?? '-', rx.pdOd ?? '-', rx.pdOs ?? '-'].join('|')
}
