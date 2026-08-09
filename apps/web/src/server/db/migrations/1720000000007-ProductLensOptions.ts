import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Qué lentes ofrece cada modelo (`axis_product_lens_option`).
 *
 * Las opciones de lente eran globales: los seis modelos ofrecían los cinco
 * lentes. Con Apex —la deportiva, con un único lente— eso dejó de ser cierto:
 * la ficha ofrecía transitions o transparente para un armazón que no los tiene,
 * y el checkout habría cobrado el sobrecosto de un lente imposible de montar.
 *
 * La tabla guarda SOLO las excepciones: **un producto sin filas ofrece todas
 * las opciones**. Así los cinco modelos casuales siguen igual sin tocar nada, y
 * un modelo nuevo no aparece sin lentes por haberse olvidado de marcarlos.
 *
 * No lleva datos de arranque: la asignación de Apex se hace desde el panel
 * (o con el script de inventario), no aquí, para no clavar en una migración un
 * dato de catálogo que el cliente cambia.
 */
export class ProductLensOptions1720000000007 implements MigrationInterface {
  name = 'ProductLensOptions1720000000007'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "axis_product_lens_option" (
        "productId" uuid NOT NULL,
        "lensOptionId" uuid NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_axis_product_lens_option" PRIMARY KEY ("productId", "lensOptionId"),
        CONSTRAINT "FK_axis_plo_product" FOREIGN KEY ("productId")
          REFERENCES "axis_product" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_axis_plo_lens" FOREIGN KEY ("lensOptionId")
          REFERENCES "axis_lens_option" ("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_axis_plo_product" ON "axis_product_lens_option" ("productId")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "axis_product_lens_option"`)
  }
}
