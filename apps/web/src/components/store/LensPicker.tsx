'use client'

import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { formatCop } from '../../lib/products'
import {
  coatingAddon,
  coatingIncludedIn,
  coatingPriceFor,
  lensDescription,
  lensName,
  lensPriceLabel,
  lensTypes,
  prescriptionAddon,
  type LensOptionDTO,
} from '../../lib/lenses'
import { summarizePrescription, type Prescription } from '../../lib/prescription'

/**
 * Configurador del lente. Son TRES preguntas, no una lista de excluyentes:
 *
 *  1. ¿QUÉ lente? — fichas compactas en rejilla (radiogroup). Solo se lee la
 *     descripción del elegido: seis párrafos abiertos a la vez convertían la
 *     ficha en un muro de barras más alto que la propia foto del producto.
 *  2. ¿CON ANTIRREFLEJO? — una casilla. Se monta sobre cualquier lente, así que
 *     no es un lente más. Su precio CAMBIA con el lente elegido (+20.000 sobre
 *     el transparente, +70.000 sobre el fotocromático) y hay lentes que ya lo
 *     traen: ahí la casilla queda marcada y bloqueada, sin costo.
 *  3. ¿CON TU FÓRMULA? — otra casilla, también independiente del tipo de lente.
 *
 * Si el lente elegido solo existe graduado (`requiresPrescription`), la casilla
 * de la fórmula queda marcada y bloqueada — la decisión ya la tomó el lente.
 */
export function LensPicker({
  options,
  value,
  onChange,
  withCoating,
  onCoatingChange,
  withPrescription,
  onPrescriptionChange,
  prescription,
  onEditPrescription,
  prescriptionPrice,
  prescriptionEstimated,
  askPrescriptionDetails = true,
}: {
  options: LensOptionDTO[]
  value: LensOptionDTO | null
  onChange: (option: LensOptionDTO) => void
  withCoating: boolean
  onCoatingChange: (on: boolean) => void
  withPrescription: boolean
  onPrescriptionChange: (on: boolean) => void
  /** La graduación ya capturada, o null si todavía no la ha escrito. */
  prescription: Prescription | null
  /** Abre el configurador por pasos (marcar la casilla también lo abre). */
  onEditPrescription: () => void
  /**
   * Lo que cuesta graduar el lente elegido con ESA fórmula, ya formateado. Lo
   * calcula la ficha con `quoteLens()`: aquí no se hacen cuentas, porque el
   * precio depende de la fórmula y del lente a la vez y repartirlo en dos
   * sitios es como se acaba mostrando un número distinto del que se cobra.
   */
  prescriptionPrice: string | null
  /** true = ese precio salió de la estimación, no de la lista del laboratorio. */
  prescriptionEstimated?: boolean
  /**
   * ¿Se le piden los datos de la graduación, o basta con la casilla?
   *
   * Solo cuando se puede COMPRAR. Con la tienda en preview o el modelo
   * agotado no hay nada que tallar ni que cobrar, y una fórmula médica caduca:
   * pedir diez cifras para guardarlas hasta que abramos —y volver a pedirlas
   * entonces, porque habrán envejecido— es fricción sin contrapartida. Ahí la
   * casilla vuelve a ser lo que era, un sí/no que viaja con la reserva.
   */
  askPrescriptionDetails?: boolean
}) {
  const { t, lang } = useDict()
  const l = t.store.lens
  const types = lensTypes(options)
  const ar = coatingAddon(options)
  const rx = prescriptionAddon(options)
  const forced = Boolean(value?.requiresPrescription)
  // El lente ya lo trae: no hay nada que decidir ni nada que cobrar.
  const arIncluded = coatingIncludedIn(value)
  const arPrice = coatingPriceFor(value)
  // Tres estados donde va el precio: incluido, un sobrecosto, o "por confirmar"
  // (la fórmula, que se cotiza al recibirla). Ver `lensPriceLabel`.
  const price = (o: LensOptionDTO) => lensPriceLabel(o, l)

  if (types.length === 0 && !rx && !ar) return null

  return (
    <div className="mt-8 space-y-6">
      {/* Un solo lente (Apex, la deportiva): no hay nada que elegir, pero
          callarlo dejaba la ficha sin decir qué lente lleva. Se enseña como
          dato, no como pregunta — un "radiogroup" de una sola tarjeta invita a
          buscar las otras. */}
      {types.length === 1 && value && (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="eyebrow text-gold">{l.title}</span>
            <span className="font-mono text-xs tracking-wide text-warm-gray/55">
              {price(value)}
            </span>
          </div>
          <p className="mt-2 text-warm-white">{lensName(value, lang)}</p>
          <p className="mt-1 text-sm leading-relaxed text-warm-gray/60">
            {lensDescription(value, lang)}
          </p>
        </div>
      )}

      {types.length > 1 && (
        <fieldset>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <legend className="eyebrow text-gold">{l.title}</legend>
            {value && (
              <span className="font-mono text-xs tracking-wide text-warm-gray/55">
                {price(value)}
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {types.map((option) => {
              const selected = value?.id === option.id
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer flex-col justify-between gap-1 rounded-xl border px-3 py-2.5 transition-colors ${
                    selected
                      ? 'border-gold/70 bg-gold/[0.07]'
                      : 'border-line hover:border-gold/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="lens-option"
                    checked={selected}
                    onChange={() => onChange(option)}
                    className="sr-only"
                  />
                  <span
                    className={`text-sm leading-snug ${selected ? 'text-warm-white' : 'text-warm-gray/80'}`}
                  >
                    {lensName(option, lang)}
                  </span>
                  <span className="font-mono text-[0.65rem] tracking-wide text-warm-gray/50">
                    {price(option)}
                  </span>
                </label>
              )
            })}
          </div>

          {/* Solo la descripción del elegido: el resto se lee al seleccionarlo. */}
          {value && (
            <p className="mt-3 text-sm leading-relaxed text-warm-gray/60">
              {lensDescription(value, lang)}
            </p>
          )}
        </fieldset>
      )}

      {ar && (
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
            withCoating || arIncluded
              ? 'border-gold/70 bg-gold/[0.07]'
              : 'border-line hover:border-gold/40'
          } ${arIncluded ? 'cursor-default' : ''}`}
        >
          <input
            type="checkbox"
            checked={withCoating || arIncluded}
            disabled={arIncluded}
            onChange={(e) => onCoatingChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#c8a96e]"
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-warm-white">{lensName(ar, lang)}</span>
              {/* El precio es el del LENTE elegido, no el de esta fila: cambia
                  al cambiar de lente, y en los que ya lo traen dice "incluido". */}
              <span className="font-mono text-xs tracking-wide text-warm-gray/55">
                {arPrice && arPrice > 0 ? `+ ${formatCop(arPrice)}` : l.included}
              </span>
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-warm-gray/60">
              {arIncluded ? l.coatingIncluded : lensDescription(ar, lang)}
            </span>
          </span>
        </label>
      )}

      {rx && (
        <div>
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
              withPrescription || forced
                ? 'border-gold/70 bg-gold/[0.07]'
                : 'border-line hover:border-gold/40'
            } ${forced ? 'cursor-default' : ''}`}
          >
            <input
              type="checkbox"
              checked={withPrescription || forced}
              disabled={forced}
              onChange={(e) => {
                // Con la compra abierta, marcarla no es solo un booleano: sin
                // los datos de la fórmula no hay precio que mostrar ni lente
                // que tallar, así que la casilla ABRE el configurador.
                // Desmarcarla sí es un booleano, y en reserva lo son las dos.
                if (e.target.checked && askPrescriptionDetails) onEditPrescription()
                else onPrescriptionChange(e.target.checked)
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#c8a96e]"
            />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-warm-white">{lensName(rx, lang)}</span>
                <span className="font-mono text-xs tracking-wide text-warm-gray/55">
                  {prescriptionPrice ?? price(rx)}
                </span>
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-warm-gray/60">
                {forced ? l.prescriptionForced : lensDescription(rx, lang)}
              </span>
            </span>
          </label>

          {(withPrescription || forced) && !askPrescriptionDetails && (
            <p className="mt-2.5 flex items-start gap-2 pl-1 text-sm text-gold/90">
              <Icon name="check" size={16} className="mt-0.5 shrink-0" />
              {l.prescriptionReserveNotice}
            </p>
          )}

          {(withPrescription || forced) && askPrescriptionDetails && (
            <div className="mt-2.5 space-y-1.5 pl-1">
              {prescription ? (
                <>
                  {/* Con la fórmula ya escrita, lo útil no es prometer que se
                      pedirá: es enseñarla para que la revise antes de pagar. */}
                  <p className="flex items-start gap-2 text-sm text-gold/90">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0" />
                    <span className="min-w-0 break-words">
                      {summarizePrescription(prescription)}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={onEditPrescription}
                    className="pl-6 text-sm text-gold/85 underline underline-offset-4 transition-colors hover:text-gold"
                  >
                    {l.prescriptionEdit}
                  </button>
                  {prescriptionEstimated && (
                    <p className="pl-6 text-sm text-warm-gray/65">{l.prescriptionEstimated}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="flex items-start gap-2 text-sm text-gold/90">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0" />
                    {l.prescriptionNotice}
                  </p>
                  {/* `pl-6` = ancho del icono (16) + su gap (8): alinea con la
                      línea de arriba sin pintar un segundo check. */}
                  <button
                    type="button"
                    onClick={onEditPrescription}
                    className="pl-6 text-sm text-gold/85 underline underline-offset-4 transition-colors hover:text-gold"
                  >
                    {l.prescriptionOpen}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
