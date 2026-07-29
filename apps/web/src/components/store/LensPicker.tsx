'use client'

import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { formatCop } from '../../lib/products'
import { lensDescription, lensName, type LensOptionDTO } from '../../lib/lenses'

/**
 * Selector del lente con el que se arman las gafas. La opción de fábrica va sin
 * costo; las personalizaciones suman su `extraPriceCop`. Si la elegida exige
 * fórmula médica, se avisa aquí y se pide en el checkout.
 *
 * Es una lista de radios accesible (no un <select>): las opciones llevan
 * descripción y precio, y deben leerse de un vistazo.
 */
export function LensPicker({
  options,
  value,
  onChange,
}: {
  options: LensOptionDTO[]
  value: LensOptionDTO | null
  onChange: (option: LensOptionDTO) => void
}) {
  const { t, lang } = useDict()
  const l = t.store.lens
  if (options.length <= 1) return null

  return (
    <fieldset className="mt-9">
      <legend className="eyebrow text-gold">{l.title}</legend>
      <p className="mt-3 text-sm text-warm-gray/65">{l.help}</p>

      <div className="mt-4 space-y-2.5">
        {options.map((option) => {
          const selected = value?.id === option.id
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                selected ? 'border-gold/70 bg-gold/[0.06]' : 'border-line hover:border-gold/40'
              }`}
            >
              <input
                type="radio"
                name="lens-option"
                checked={selected}
                onChange={() => onChange(option)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#c8a96e]"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="font-head text-warm-white">{lensName(option, lang)}</span>
                  <span className="font-mono text-xs tracking-wide text-warm-gray/70">
                    {option.extraPriceCop > 0 ? `+ ${formatCop(option.extraPriceCop)}` : l.included}
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-warm-gray/65">
                  {lensDescription(option, lang)}
                </span>
                {option.requiresPrescription && selected && (
                  <span className="mt-2 flex items-start gap-2 text-sm text-gold/90">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0" />
                    {l.prescriptionNotice}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
