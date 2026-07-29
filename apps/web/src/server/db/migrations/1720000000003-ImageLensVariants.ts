import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Fotos por variante de lente.
 *
 * Un mismo modelo se fotografía con lentes distintos (de sol, transparente para
 * fórmula, filtro amarillo en el deportivo). La ficha debe mostrar las fotos que
 * corresponden al lente que el cliente eligió, no una mezcla.
 *
 *  - axis_product_image.lensVariant: con qué lente se tomó la foto. NULL = sirve
 *    para cualquiera (estuche, accesorios, empaque).
 *  - axis_lens_option.imageVariant: qué fotos mostrar al elegir esa opción.
 */
export class ImageLensVariants1720000000003 implements MigrationInterface {
  name = 'ImageLensVariants1720000000003'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "axis_product_image" ADD COLUMN "lensVariant" varchar(24)`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_axis_product_image_variant" ON "axis_product_image" ("productId", "lensVariant")`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_lens_option" ADD COLUMN "imageVariant" varchar(24)`,
    )

    // Mapeo inicial de las opciones sembradas: el lente de sol muestra las fotos
    // de sol; todo lo que se monta con la óptica (fórmula, transitions, filtros
    // transparentes) muestra las de lente claro; el filtro amarillo, las suyas.
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "imageVariant" = 'sunglass' WHERE "slug" = 'sol-polarizado'`,
    )
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "imageVariant" = 'ophthalmic'
        WHERE "slug" IN ('formula-medica', 'transitions', 'filtro-azul', 'transparente')`,
    )
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "imageVariant" = 'yellow' WHERE "slug" = 'filtro-amarillo'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "axis_lens_option" DROP COLUMN IF EXISTS "imageVariant"`,
    )
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_axis_product_image_variant"`)
    await queryRunner.query(
      `ALTER TABLE "axis_product_image" DROP COLUMN IF EXISTS "lensVariant"`,
    )
  }
}
