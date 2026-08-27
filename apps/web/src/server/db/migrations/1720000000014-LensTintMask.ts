import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Teñir el lente en el NAVEGADOR en vez de guardar una foto por color.
 *
 * El catálogo tiene un problema de cobertura que no se arregla fotografiando
 * más: cinco tipos de lente × seis modelos × cinco ángulos son 150 fotos. Hoy
 * hay 34, y cuando falta la variante `imagesForLens()` cae a otra — o sea que
 * quien elige filtro amarillo en Crystal ve el lente transparente. Enseñar un
 * lente que no es el que se está comprando es peor que no enseñar nada.
 *
 * La salida es que UNA foto sirva para todas: sobre la foto del lente
 * transparente el navegador pinta una capa de color en `mix-blend-mode:
 * multiply`, recortada a la silueta del lente. No se genera ninguna imagen —
 * cambiar de lente es cambiar un color en CSS, sin red y sin recarga.
 *
 * Esta migración añade las dos piezas que faltan:
 *
 * `axis_product_image.lensMask` — la silueta del lente de ESA foto, como
 * `data:` URI de un WebP alfa de 160px (≈1,2 KB en base64). Va incrustada en la
 * fila y no como objeto en S3 por una razón medida, no por gusto: `mask-image`
 * está sujeto a CORS y CloudFront hoy NO manda `Access-Control-Allow-Origin` en
 * GET, así que una máscara servida desde el CDN se bloquea y la capa desaparece
 * entera. El `data:` URI esquiva el problema, ahorra una petición por foto y no
 * obliga a tocar la configuración de AWS. Las máscaras las extrae
 * `pnpm images:masks`, que NO las dibuja a mano: el lente transparente es una
 * isla clara encerrada por el aro oscuro, y sale con umbral + relleno del fondo
 * + componentes conexas.
 *
 * **La presencia de la máscara es el permiso.** Solo se le puede generar a una
 * foto de lente transparente (teñir es `multiply`: únicamente oscurece, así que
 * de un lente oscuro no sale ningún color). Una foto sin máscara nunca se tiñe.
 *
 * `axis_lens_option.tintColor` — de qué color se pinta cada opción. `null` = no
 * se simula (el lente transparente es la foto base: teñirlo de nada sería
 * pintarlo dos veces; el antirreflejo y la fórmula no cambian el color).
 *
 * Y separa `transitions` y `filtro-azul` en su propia `imageVariant`. Estaban
 * las dos en `ophthalmic` junto con el transparente, y esa mezcla rompía la
 * regla "si hay foto real de tu variante, manda la foto real": las tres
 * compartían las fotos del lente claro, así que transitions habría enseñado un
 * lente transparente en vez de teñirse de gris. Con variante propia —y sin
 * ninguna foto etiquetada así— caen limpiamente en el tinte. La columna es
 * `varchar`, no un enum de Postgres, así que ampliar los valores posibles es
 * solo TypeScript: aquí únicamente se mueven datos.
 */
export class LensTintMask1720000000014 implements MigrationInterface {
  name = 'LensTintMask1720000000014'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "axis_product_image" ADD COLUMN IF NOT EXISTS "lensMask" text`)
    await queryRunner.query(
      `ALTER TABLE "axis_lens_option" ADD COLUMN IF NOT EXISTS "tintColor" varchar(9)`,
    )

    // Los colores son los del lente PLANO sobre fondo claro, medidos contra las
    // fotos reales de sol del catálogo (Origin, Shadow, Ocean) para que el
    // Crystal teñido y el Origin fotografiado no se vean de dos marcas
    // distintas. `multiply` los oscurece con la foto, así que aquí van más
    // claros de lo que acaban pintando.
    const tints: [string, string | null][] = [
      ['sol-polarizado', '#3b3833'],
      ['transitions', '#6f665b'],
      ['filtro-amarillo', '#f0c23c'],
      ['filtro-azul', '#dde2f4'],
      // El transparente es la foto base: no se tiñe de nada.
      ['transparente', null],
    ]
    for (const [slug, color] of tints) {
      await queryRunner.query(`UPDATE "axis_lens_option" SET "tintColor" = $1 WHERE "slug" = $2`, [
        color,
        slug,
      ])
    }

    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "imageVariant" = 'transitions' WHERE "slug" = 'transitions'`,
    )
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "imageVariant" = 'blue' WHERE "slug" = 'filtro-azul'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "imageVariant" = 'ophthalmic'
         WHERE "slug" IN ('transitions', 'filtro-azul')`,
    )
    await queryRunner.query(`ALTER TABLE "axis_lens_option" DROP COLUMN IF EXISTS "tintColor"`)
    await queryRunner.query(`ALTER TABLE "axis_product_image" DROP COLUMN IF EXISTS "lensMask"`)
  }
}
