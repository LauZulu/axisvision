'use client'

import { imagesForLens, lensName, lensTypes, type LensOptionDTO } from '../../lib/lenses'
import { useDict } from '../../i18n/useDict'
import type { ImageLensVariant } from '../../lib/products'

export type PreviewImage = { key: string; lensVariant: ImageLensVariant | null }

/**
 * Resumen de qué galería verá el cliente al elegir cada opción de lente,
 * calculado con la MISMA función que la ficha (`imagesForLens`).
 *
 * Los grupos de arriba dicen qué fotos HAY; esto dice qué se VE, que no es lo
 * mismo: las opciones son cinco y los grupos cuatro (transitions, transparente y
 * filtro azul comparten fotos), y cuando un grupo está vacío la ficha cae a otro
 * —nunca mezcla dos variantes—. Esa regla de respaldo es imposible de deducir
 * mirando las fotos, y antes solo se comprobaba entrando a la tienda modelo por
 * modelo. Va sin miniaturas a propósito: las fotos ya están justo encima.
 */
export function LensGalleryPreview({
  images,
  options,
}: {
  images: PreviewImage[]
  options: LensOptionDTO[]
}) {
  const { t, lang } = useDict()
  const im = t.admin.images
  const types = lensTypes(options)
  if (types.length === 0) return null

  const groupLabel: Record<ImageLensVariant, string> = {
    sunglass: im.groupSun,
    ophthalmic: im.groupOphthalmic,
    yellow: im.groupYellow,
  }
  const neutrals = images.filter((i) => i.lensVariant === null).length
  // Ninguna foto clasificada: la ficha las enseña todas con cualquier lente.
  const sinClasificar = images.length > 0 && neutrals === images.length

  return (
    <div className="mt-8 rounded-lg border border-line p-3 sm:p-4">
      <div className="text-sm text-warm-gray/80">{im.previewTitle}</div>
      <p className="mt-1 text-xs text-warm-gray/45">{im.previewHint}</p>

      <ul className="mt-3 space-y-2">
        {types.map((lens) => {
          const shown = imagesForLens(images, lens)
          const wanted = lens.imageVariant
          // Grupo que acabó mandando (el de la primera foto no común).
          const used = shown.find((i) => i.lensVariant !== null)?.lensVariant ?? null

          let note: string
          if (shown.length === 0) note = im.previewEmpty
          else if (sinClasificar || wanted === null) note = im.previewAll
          else if (used === wanted) note = groupLabel[wanted]
          else note = im.previewFallback.replace('{group}', used ? groupLabel[used] : im.groupNeutral)

          return (
            <li
              key={lens.id}
              className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-line/60 pb-2 last:border-0 last:pb-0"
            >
              <span className="text-sm text-warm-white">{lensName(lens, lang)}</span>
              <span className="font-mono text-[0.65rem] text-warm-gray/60">
                {shown.length > 0 && `${shown.length} · `}
                {note}
                {neutrals > 0 && !sinClasificar && shown.length > 0 && (
                  <span className="text-warm-gray/40">
                    {' '}
                    {im.previewNeutral.replace('{n}', String(neutrals))}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
