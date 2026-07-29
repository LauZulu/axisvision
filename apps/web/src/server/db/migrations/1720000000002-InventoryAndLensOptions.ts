import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Inventario real por unidad + personalización de lente.
 *
 *  - axis_product.modelCode / brand: llave contra el Excel de inventario ("M02").
 *  - axis_product_unit: una fila por gafa FÍSICA (serial AX01…). `stock` pasa a
 *    ser un valor DERIVADO de esta tabla.
 *  - axis_lens_option: catálogo de lentes que el cliente elige (polarizado de
 *    fábrica, fórmula con la óptica aliada, transitions, filtros…).
 *  - axis_order_item: snapshot del lente elegido y su sobrecosto.
 *
 * Solo toca tablas `axis_*`. No borra datos existentes.
 */
export class InventoryAndLensOptions1720000000002 implements MigrationInterface {
  name = 'InventoryAndLensOptions1720000000002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Catálogo: código de modelo, marca y talla ---
    await queryRunner.query(`ALTER TABLE "axis_product" ADD COLUMN "modelCode" varchar(40)`)
    await queryRunner.query(
      `ALTER TABLE "axis_product" ADD COLUMN "brand" varchar(60) NOT NULL DEFAULT 'AXIS'`,
    )
    await queryRunner.query(`ALTER TABLE "axis_product" ADD COLUMN "size" varchar(16)`)
    // Único pero nullable: Postgres permite varios NULL, así que los productos
    // sin modelo asignado no chocan entre sí.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_axis_product_modelCode" ON "axis_product" ("modelCode")`,
    )

    // --- Inventario por unidad física ---
    await queryRunner.query(`
      CREATE TABLE "axis_product_unit" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" varchar(24) NOT NULL,
        "productId" uuid NOT NULL,
        "unitNumber" integer NOT NULL,
        "lensType" varchar(24) NOT NULL DEFAULT 'sunglass_polarized',
        "location" varchar(16) NOT NULL DEFAULT 'casa',
        "sellable" boolean NOT NULL DEFAULT true,
        "note" text,
        "orderItemId" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_axis_product_unit" PRIMARY KEY ("id"),
        CONSTRAINT "FK_axis_product_unit_product" FOREIGN KEY ("productId")
          REFERENCES "axis_product" ("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_axis_product_unit_code" ON "axis_product_unit" ("code")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_axis_product_unit_product" ON "axis_product_unit" ("productId")`,
    )
    // Índice del conteo de stock: unidades vendibles por producto y ubicación.
    await queryRunner.query(
      `CREATE INDEX "IDX_axis_product_unit_stock" ON "axis_product_unit" ("productId", "sellable", "location")`,
    )

    // --- Opciones de lente ---
    await queryRunner.query(`
      CREATE TABLE "axis_lens_option" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" varchar(80) NOT NULL,
        "nameEs" varchar(120) NOT NULL,
        "nameEn" varchar(120) NOT NULL,
        "descriptionEs" varchar(300) NOT NULL DEFAULT '',
        "descriptionEn" varchar(300) NOT NULL DEFAULT '',
        "extraPriceCop" integer NOT NULL DEFAULT 0,
        "requiresPrescription" boolean NOT NULL DEFAULT false,
        "isDefault" boolean NOT NULL DEFAULT false,
        "active" boolean NOT NULL DEFAULT true,
        "position" integer NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_axis_lens_option" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_axis_lens_option_slug" ON "axis_lens_option" ("slug")`,
    )

    // --- Snapshot del lente en la línea de pedido ---
    await queryRunner.query(`ALTER TABLE "axis_order_item" ADD COLUMN "lensOptionId" uuid`)
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" ADD COLUMN "lensOptionName" varchar(120)`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" ADD COLUMN "lensExtraPriceCop" integer NOT NULL DEFAULT 0`,
    )
    await queryRunner.query(`ALTER TABLE "axis_order_item" ADD COLUMN "prescriptionNote" text`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "prescriptionNote"`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "lensExtraPriceCop"`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "lensOptionName"`,
    )
    await queryRunner.query(`ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "lensOptionId"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "axis_lens_option"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "axis_product_unit"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_axis_product_modelCode"`)
    await queryRunner.query(`ALTER TABLE "axis_product" DROP COLUMN IF EXISTS "size"`)
    await queryRunner.query(`ALTER TABLE "axis_product" DROP COLUMN IF EXISTS "brand"`)
    await queryRunner.query(`ALTER TABLE "axis_product" DROP COLUMN IF EXISTS "modelCode"`)
  }
}
