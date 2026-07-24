import type { StaticImageData } from 'next/image'
import { cdnUrl } from './cdn'

// Catálogo de imágenes del sitio servidas desde S3 vía CloudFront (claves `site/...`).
// Sustituye a los assets del repo: cada entrada replica la forma de StaticImageData
// (src + dimensiones intrínsecas) para que <Img>/next/image mantengan cero CLS.
// Las dimensiones son las del original subido; si se reemplaza una foto en S3
// con otro tamaño, actualizar aquí. Subida/actualización: scripts/migrate-images-to-s3.mts.

function img(key: string, width: number, height: number): StaticImageData {
  return { src: cdnUrl(key), width, height }
}

export const heroProducto = img('site/hero/hero-producto.jpeg', 1364, 1153)
export const heroProducto02 = img('site/hero/hero-producto-02.jpeg', 1535, 1024)

export const modelo01 = img('site/lifestyle/modelo-01.jpg', 3072, 4080)
export const modelo02 = img('site/lifestyle/modelo-02.jpg', 3072, 4080)
export const modelo03 = img('site/lifestyle/modelo-03.jpg', 3072, 4080)
export const modelo04 = img('site/lifestyle/modelo-04.jpg', 2736, 3648)
export const modelo05 = img('site/lifestyle/modelo-05.jpeg', 720, 1280)
/** Mujer con gafas (jpg). */
export const modelo06 = img('site/lifestyle/modelo-06.jpg', 3072, 4080)
/** Ciclista (jpeg, archivo distinto al anterior). */
export const modelo06Ciclista = img('site/lifestyle/modelo-06.jpeg', 2773, 4160)
export const modelo07 = img('site/lifestyle/modelo-07.jpeg', 2268, 4032)
export const modelo08 = img('site/lifestyle/modelo-08.jpeg', 2268, 4032)

export const empaqueAbierto = img('site/packaging/empaque-abierto-con-gafas.jpeg', 1600, 1355)
export const empaqueCerrado = img('site/packaging/empaque-cerrado.jpeg', 1280, 649)
export const gafasDeFrente = img('site/packaging/gafas-de-frente.jpeg', 1280, 381)

export const axisEnCafe = img('site/retail/axis-en-cafe.jpg', 3072, 4080)
export const axisEnCafe02 = img('site/retail/axis-en-cafe-02.jpg', 3072, 4080)
