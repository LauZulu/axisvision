'use client'

import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { formatCop } from '../../lib/products'
import {
  lensDescription,
  lensName,
  lensTypes,
  prescriptionAddon,
  type LensOptionDTO,
} from '../../lib/lenses'

/**
 * Configurador del lente. Son DOS preguntas, no una lista de excluyentes:
 *
 *  1. ¿QUÉ lente? — fichas compactas en rejilla (radiogroup). Solo se lee la
 *     descripción del elegido: seis párrafos abiertos a la vez convertían la
 *     ficha en un muro de barras más alto que la propia foto del producto.
 *  2. ¿CON TU FÓRMULA? — una casilla. La graduación se puede montar sobre
 *     cualquier lente, así que no es un lente más: es un complemento que suma.
 *
 * Si el lente elegido solo existe graduado (`requiresPrescription`), la casilla
 * queda marcada y bloqueada — la decisión ya la tomó el lente.
 */
export function LensPicker({
  options,
  value,
  onChange,
  withPrescription,
  onPrescriptionChange,
}: {
  options: LensOptionDTO[]
  value: LensOptionDTO | null
  onChange: (option: LensOptionDTO) => void
  withPrescription: boolean
  onPrescriptionChange: (on: boolean) => void
}) {
  const { t, lang } = useDict()
  const l = t.store.lens
  const types = lensTypes(options)
  const rx = prescriptionAddon(options)
  const forced = Boolean(value?.requiresPrescription)

  if (types.length <= 1 && !rx) return null

  return (
    <div className="mt-8 space-y-6">
      {types.length > 1 && (
        <fieldset>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <legend className="eyebrow text-gold">{l.title}</legend>
            {value && (
              <span className="font-mono text-xs tracking-wide text-warm-gray/55">
                {value.extraPriceCop > 0 ? `+ ${formatCop(value.extraPriceCop)}` : l.included}
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
                    {option.extraPriceCop > 0
                      ? `+ ${formatCop(option.extraPriceCop)}`
                      : l.included}
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
                  {rx.extraPriceCop > 0 ? `+ ${formatCop(rx.extraPriceCop)}` : l.included}
                </span>
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-warm-gray/60">
                {forced ? l.prescriptionForced : lensDescription(rx, lang)}
              </span>
            </span>
          </label>

          {(withPrescription || forced) && (
            <p className="mt-2.5 flex items-start gap-2 pl-1 text-sm text-gold/90">
              <Icon name="check" size={16} className="mt-0.5 shrink-0" />
              {l.prescriptionNotice}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
