'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cdnUrl } from '../../lib/cdn'
import { useDict } from '../../i18n/useDict'
import type { ImageLensVariant } from '../../lib/products'

/** Foto del formulario: clave en S3 + con qué lente se tomó. */
export type UploaderImage = { key: string; lensVariant: ImageLensVariant | null }

/**
 * Orden CANÓNICO de los grupos. Es también el orden en que se guardan las fotos
 * en la DB (una sola columna `position` para todo el producto), así que la
 * galería de la ficha —que filtra por variante conservando el orden— sale
 * exactamente como se ve aquí.
 */
const GROUPS: (ImageLensVariant | null)[] = ['sunglass', 'ophthalmic', 'yellow', null]

/** Reconstruye la lista plana a partir de los grupos, en el orden canónico. */
function flatten(byGroup: Map<ImageLensVariant | null, UploaderImage[]>): UploaderImage[] {
  return GROUPS.flatMap((v) => byGroup.get(v) ?? [])
}

function group(images: UploaderImage[]): Map<ImageLensVariant | null, UploaderImage[]> {
  const map = new Map<ImageLensVariant | null, UploaderImage[]>(GROUPS.map((v) => [v, []]))
  for (const img of images) map.get(img.lensVariant ?? null)!.push(img)
  return map
}

/**
 * Gestor de fotos del producto, PARTIDO POR LENTE. Sube directo a S3 con
 * presigned PUT (el binario nunca pasa por el backend).
 *
 * La rejilla única con un desplegable por foto obligaba a leer trece
 * desplegables para saber qué se vería con cada lente. Aquí cada grupo es una
 * sección con su propio botón de subir —así al cargar una foto ya se dice a qué
 * lente pertenece, en vez de subirla y clasificarla después— y sus fotos van
 * numeradas: ese número es el orden real en la ficha y el 1 es la portada.
 *
 * Las fotos quitadas se limpian de S3 al guardar el producto (ver admin.ts).
 */
export function ImageUploader({
  value,
  onChange,
  slug,
}: {
  value: UploaderImage[]
  onChange: (images: UploaderImage[]) => void
  /** Slug del producto: agrupa las fotos en `products/<slug>/` dentro del bucket. */
  slug?: string
}) {
  const { t } = useDict()
  const im = t.admin.images
  // Qué grupo está subiendo (null = ninguno). Por grupo, no global: subir fotos
  // de sol no tiene por qué bloquear el botón de las transparentes.
  const [busy, setBusy] = useState<ImageLensVariant | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const byGroup = group(value)

  const label: Record<string, string> = {
    sunglass: im.groupSun,
    ophthalmic: im.groupOphthalmic,
    yellow: im.groupYellow,
    neutral: im.groupNeutral,
  }
  const hint: Record<string, string> = {
    sunglass: im.groupSunHint,
    ophthalmic: im.groupOphthalmicHint,
    yellow: im.groupYellowHint,
    neutral: im.groupNeutralHint,
  }
  const nameOf = (v: ImageLensVariant | null) => label[v ?? 'neutral']

  async function uploadOne(file: File): Promise<string | null> {
    const presign = await fetch('/api/admin/uploads/presign', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        operation: 'put',
        filename: file.name,
        contentType: file.type,
        slug,
      }),
    })
    if (!presign.ok) return null
    const { key, url } = (await presign.json()) as { key: string; url: string }
    const put = await fetch(url, { method: 'PUT', body: file, headers: { 'content-type': file.type } })
    return put.ok ? key : null
  }

  /** Sube al grupo `variant`: la foto nace ya clasificada. */
  async function onFiles(files: FileList | null, variant: ImageLensVariant | null) {
    if (!files || files.length === 0) return
    setBusy(variant)
    setError(null)
    const added: UploaderImage[] = []
    for (const file of Array.from(files)) {
      const key = await uploadOne(file)
      if (key) added.push({ key, lensVariant: variant })
      else setError(im.error)
    }
    if (added.length) {
      const next = group(value)
      next.set(variant, [...next.get(variant)!, ...added])
      onChange(flatten(next))
    }
    setBusy(undefined)
  }

  /** Mueve una foto dentro de su grupo (cambia su orden en la ficha). */
  function move(variant: ImageLensVariant | null, index: number, dir: -1 | 1) {
    const next = group(value)
    const list = [...next.get(variant)!]
    const target = index + dir
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
    next.set(variant, list)
    onChange(flatten(next))
  }

  function remove(key: string) {
    onChange(value.filter((img) => img.key !== key))
  }

  /** Cambia una foto de grupo (se va al final del grupo destino). */
  function moveToGroup(key: string, variant: ImageLensVariant | null) {
    const img = value.find((i) => i.key === key)
    if (!img || (img.lensVariant ?? null) === variant) return
    const next = group(value.filter((i) => i.key !== key))
    next.set(variant, [...next.get(variant)!, { ...img, lensVariant: variant }])
    onChange(flatten(next))
  }

  return (
    <div>
      <div className="mb-1 text-sm text-warm-gray/80">{im.label}</div>
      <p className="mb-4 text-xs text-warm-gray/45">{im.groupsHint}</p>

      <div className="space-y-6">
        {GROUPS.map((variant) => {
          const list = byGroup.get(variant)!
          const key = variant ?? 'neutral'
          return (
            <section key={key}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-line pb-2">
                <h3 className="eyebrow text-gold">{nameOf(variant)}</h3>
                <span className="font-mono text-[0.65rem] text-warm-gray/45">
                  {list.length === 0 ? im.groupEmpty : `${list.length}`}
                </span>
                <span className="w-full text-xs text-warm-gray/45 sm:w-auto">{hint[key]}</span>
              </div>

              {list.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {list.map((img, i) => (
                    <div key={img.key} className="group rounded-lg border border-line p-1.5">
                      <div className="relative aspect-square overflow-hidden rounded">
                        <Image
                          src={cdnUrl(img.key)}
                          alt=""
                          fill
                          sizes="160px"
                          className="object-cover"
                        />

                        {/* El número ES el orden en la ficha; el 1 es la portada
                            de este lente. */}
                        <span
                          className={`absolute left-1 top-1 grid h-5 min-w-5 place-items-center rounded px-1 font-mono text-[0.6rem] ${
                            i === 0
                              ? 'bg-gold text-carbon-900'
                              : 'bg-carbon-900/80 text-warm-gray/90'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(img.key)}
                          aria-label={im.remove}
                          className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-carbon-900/80 text-warm-gray/90 hover:text-red-400 md:h-5 md:w-5"
                        >
                          ×
                        </button>

                        {/* Reordenar. Visible SIEMPRE en táctil: con `group-hover`
                            las flechas no existían en un teléfono y no había forma
                            de elegir la portada desde el móvil. */}
                        <div className="absolute inset-x-0 bottom-0 flex justify-between bg-carbon-900/70 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => move(variant, i, -1)}
                            disabled={i === 0}
                            aria-label={im.moveBefore}
                            className="px-3 py-2 text-warm-gray/90 hover:text-gold disabled:opacity-30 md:px-2 md:py-1"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            onClick={() => move(variant, i, 1)}
                            disabled={i === list.length - 1}
                            aria-label={im.moveAfter}
                            className="px-3 py-2 text-warm-gray/90 hover:text-gold disabled:opacity-30 md:px-2 md:py-1"
                          >
                            ▶
                          </button>
                        </div>
                      </div>

                      {/* Cambiar de grupo sin volver a subir la foto. Ofrece solo
                          los OTROS grupos y se queda en el rótulo: repetir en cada
                          ficha el grupo que ya dice el título de la sección era
                          trece veces la misma palabra. Se mantiene `<select>`
                          nativo (el panel se usa desde el móvil), con `text-base`:
                          por debajo de 16px, Safari de iOS hace zoom al enfocar. */}
                      <select
                        value=""
                        onChange={(e) => {
                          const v = e.target.value
                          if (!v) return
                          moveToGroup(img.key, v === 'neutral' ? null : (v as ImageLensVariant))
                        }}
                        aria-label={im.moveToGroup}
                        className="mt-1.5 w-full rounded border border-line bg-carbon-900 px-1.5 py-1.5 text-base text-warm-gray/60 outline-none focus:border-gold/60 sm:text-sm"
                      >
                        <option value="">{im.moveToGroup}</option>
                        {GROUPS.filter((g) => g !== variant).map((g) => (
                          <option key={g ?? 'neutral'} value={g ?? 'neutral'}>
                            {nameOf(g)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <label className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-line px-4 py-2.5 text-sm text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold sm:w-auto sm:py-2">
                {busy === variant ? im.uploading : `${im.upload} · ${nameOf(variant)}`}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  disabled={busy !== undefined}
                  onChange={(e) => onFiles(e.target.files, variant)}
                  className="hidden"
                />
              </label>
            </section>
          )
        })}
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
