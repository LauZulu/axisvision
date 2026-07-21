import type { StaticImageData } from 'next/image'

// Resolución de imágenes: la DB guarda una CLAVE (string) por foto; aquí la
// mapeamos a la imagen local optimizada por next/image. En el futuro, cuando las
// fotos vivan en S3, la clave será una URL http(s) y se usará directamente.
import gafasFrente from '../assets/packaging/gafas-de-frente.jpeg'
import empaqueAbierto from '../assets/packaging/empaque-abierto-con-gafas.jpeg'
import heroProducto from '../assets/hero/hero-producto.jpeg'
import heroProducto02 from '../assets/hero/hero-producto-02.jpeg'
import modelo01 from '../assets/lifestyle/modelo-01.jpg'
import modelo02 from '../assets/lifestyle/modelo-02.jpg'
import modelo03 from '../assets/lifestyle/modelo-03.jpg'
import modelo05 from '../assets/lifestyle/modelo-05.jpeg'
import modelo07 from '../assets/lifestyle/modelo-07.jpeg'
import modelo08 from '../assets/lifestyle/modelo-08.jpeg'
import cafe from '../assets/retail/axis-en-cafe.jpg'
import cafe02 from '../assets/retail/axis-en-cafe-02.jpg'

/** Mapa clave → imagen local (catálogo de prueba, imágenes repetidas). */
export const ASSET_MAP: Record<string, StaticImageData> = {
  'gafas-de-frente': gafasFrente,
  'empaque-abierto': empaqueAbierto,
  'hero-producto': heroProducto,
  'hero-producto-02': heroProducto02,
  'modelo-01': modelo01,
  'modelo-02': modelo02,
  'modelo-03': modelo03,
  'modelo-05': modelo05,
  'modelo-07': modelo07,
  'modelo-08': modelo08,
  cafe: cafe,
  'cafe-02': cafe02,
}

/** Claves disponibles (para el selector de fotos del admin). */
export const AVAILABLE_IMAGE_KEYS = Object.keys(ASSET_MAP)

// Imagen de respaldo si una clave no existe (evita romper la UI).
const FALLBACK = gafasFrente

/** Devuelve la imagen local para una clave de la DB (con respaldo). */
export function resolveImage(key: string): StaticImageData {
  return ASSET_MAP[key] ?? FALLBACK
}
