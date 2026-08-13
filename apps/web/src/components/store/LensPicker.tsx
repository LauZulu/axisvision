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
}: {
  options: LensOptionDTO[]
  value: LensOptionDTO | null
  onChange: (option: LensOptionDTO) => void
  withCoating: boolean
  onCoatingChange: (on: boolean) => void
  withPrescription: boolean
  onPrescriptionChange: (on: boolean) => void
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
              onChange={(e) => onPrescriptionChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#c8a96e]"
            />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-warm-white">{lensName(rx, lang)}</span>
                <span className="font-mono text-xs tracking-wide text-warm-gray/55">
                  {price(rx)}
                </span>
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-warm-gray/60">
                {forced ? l.prescriptionForced : lensDescription(rx, lang)}
              </span>
            </span>
          </label>

          {/* Dos avisos distintos y los dos hacen falta al marcar la casilla:
              qué le vamos a pedir (los datos) y qué NO le estamos cobrando
              ahora. Sin el segundo, el precio de arriba se lee como el final. */}
          {(withPrescription || forced) && (
            <div className="mt-2.5 space-y-1.5 pl-1">
              <p className="flex items-start gap-2 text-sm text-gold/90">
                <Icon name="check" size={16} className="mt-0.5 shrink-0" />
                {l.prescriptionNotice}
              </p>
              {/* `pl-6` = ancho del icono (16) + su gap (8): alinea con la
                  línea de arriba sin pintar un segundo check. */}
              {rx.priceOnQuote && (
                <p className="pl-6 text-sm text-warm-gray/65">{l.prescriptionQuoteNotice}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
