'use client'

import { useState } from 'react'
import Image from 'next/image'
import { resolveImage } from '../../lib/productImages'
import { cdnUrl, isRemoteImage } from '../../lib/cdn'

/**
 * Gestor de fotos del producto. Sube directo a S3 con presigned PUT (el binario
 * nunca pasa por el backend). Permite reordenar (la 1ª es la principal) y quitar.
 * Las fotos quitadas se limpian de S3 al guardar el producto (ver admin.ts).
 */
export function ImageUploader({
  value,
  onChange,
}: {
  value: string[]
  onChange: (keys: string[]) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function uploadOne(file: File): Promise<string | null> {
    const presign = await fetch('/api/admin/uploads/presign', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ operation: 'put', filename: file.name, contentType: file.type }),
    })
    if (!presign.ok) return null
    const { key, url } = (await presign.json()) as { key: string; url: string }
    const put = await fetch(url, { method: 'PUT', body: file, headers: { 'content-type': file.type } })
    return put.ok ? key : null
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setBusy(true)
    setError(null)
    const added: string[] = []
    for (const file of Array.from(files)) {
      const key = await uploadOne(file)
      if (key) added.push(key)
      else setError('Alguna imagen no se pudo subir (revisa CORS del bucket).')
    }
    if (added.length) onChange([...value, ...added])
    setBusy(false)
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...value]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  function remove(key: string) {
    onChange(value.filter((k) => k !== key))
  }

  const thumbSrc = (key: string) => (isRemoteImage(key) ? cdnUrl(key) : resolveImage(key))

  return (
    <div>
      <div className="mb-2 text-sm text-warm-gray/80">
        Fotos <span className="text-warm-gray/45">(se suben a S3; la 1ª es la principal)</span>
      </div>

      {value.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {value.map((key, i) => (
            <div key={key} className="group relative aspect-square overflow-hidden rounded-lg border border-line">
              <Image src={thumbSrc(key)} alt="" fill sizes="120px" className="object-cover" />

              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 font-mono text-[0.55rem] tracking-wide text-carbon-900">
                  PRINCIPAL
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(key)}
                aria-label="Quitar foto"
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-carbon-900/80 text-warm-gray/90 hover:text-red-400"
              >
                ×
              </button>

              {/* Reordenar */}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-carbon-900/70 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Mover antes"
                  className="px-2 py-1 text-warm-gray/90 hover:text-gold disabled:opacity-30"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label="Mover después"
                  className="px-2 py-1 text-warm-gray/90 hover:text-gold disabled:opacity-30"
                >
                  ▶
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold">
        {busy ? 'Subiendo…' : 'Subir fotos'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          disabled={busy}
          onChange={(e) => onFiles(e.target.files)}
          className="hidden"
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
