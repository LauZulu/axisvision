import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * La fórmula médica pasa de ser un párrafo sin precio a ser un dato que se
 * cotiza en la página.
 *
 * Tres piezas:
 *
 *  1. **`axis_lens_rx_price`** — la matriz (lente × monofocal/progresiva ×
 *     índice) con el precio del lente GRADUADO. La lista del laboratorio 2026
 *     que tenemos es de terminados 1,5: solo esas filas se pueden sembrar de
 *     verdad, y son las que se siembran. Todo lo demás lo estima
 *     `estimateRxPrice()` hasta que alguien cargue el renglón real desde
 *     `/admin/lentes`. Sembrar el resto a ojo aquí habría dejado números
 *     inventados con pinta de precio de lista.
 *
 *  2. **`axis_appointment`** — la cita para tomar la fórmula, para quien no la
 *     tiene a la mano. Tabla propia y no un `source` más de `axis_stock_alert`:
 *     esa lista responde "avísame cuando vuelva a haber" y su aviso automático
 *     se dispara con el stock, que aquí no tiene nada que ver.
 *
 *  3. **Snapshot en `axis_order_item`** — la fórmula estructurada, el índice
 *     aplicado y si el precio fue estimado. Lo cobrado no puede depender de
 *     filas que se editen después, y el aviso de "estimado" es parte de lo que
 *     se le prometió al cliente ese día.
 *
 * La fila `prescription` del configurador se queda: sigue siendo LA PREGUNTA
 * ("¿con tu fórmula?"). Lo que cambia es que su precio deja de ser el que
 * manda — con fórmula capturada, el precio lo pone el lente graduado.
 */
export class PrescriptionPricing1720000000012 implements MigrationInterface {
  name = 'PrescriptionPricing1720000000012'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "axis_lens_rx_price" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "lensOptionId" uuid NOT NULL,
        "rxType" varchar(16) NOT NULL,
        "lensIndex" varchar(8) NOT NULL,
        "priceCop" integer NOT NULL,
        "arExtraPriceCop" integer,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_axis_lens_rx_price" PRIMARY KEY ("id"),
        CONSTRAINT "FK_axis_lens_rx_price_option" FOREIGN KEY ("lensOptionId")
          REFERENCES "axis_lens_option"("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_axis_lens_rx_price"
         ON "axis_lens_rx_price" ("lensOptionId", "rxType", "lensIndex")`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_axis_lens_rx_price_option"
         ON "axis_lens_rx_price" ("lensOptionId")`,
    )

    /**
     * Siembra: monofocal 1.50 = el renglón de terminados que ya está en la
     * tienda, y el mismo antirreflejo. Es la única combinación de la que
     * tenemos precio de verdad; con ella, una fórmula suave (hasta ±2.00) se
     * cobra exactamente lo que hoy vale ese lente, sin sorpresas.
     *
     * El polarizado no se siembra a propósito: va incluido con la montura
     * (`extraPriceCop = 0`) y graduarlo NO es gratis, así que un renglón a
     * precio 0 sería peor que no tener renglón — regalaría el tallado. Sin
     * fila, lo estima el suelo de `baseCop`, y en PENDIENTES está anotado que
     * falta justamente el precio del polarizado graduado.
     */
    await queryRunner.query(`
      INSERT INTO "axis_lens_rx_price" ("lensOptionId", "rxType", "lensIndex", "priceCop", "arExtraPriceCop")
      SELECT "id", 'single', '1.50', "extraPriceCop", "arExtraPriceCop"
      FROM "axis_lens_option"
      WHERE "kind" = 'lens' AND "extraPriceCop" > 0
      ON CONFLICT ("lensOptionId", "rxType", "lensIndex") DO NOTHING
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "axis_appointment" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "productId" uuid,
        "lensOptionId" uuid,
        "name" varchar(120) NOT NULL,
        "phone" varchar(24) NOT NULL,
        "email" varchar(255),
        "city" varchar(120),
        "preferredTime" varchar(200),
        "note" text,
        "status" varchar(16) NOT NULL DEFAULT 'pending',
        "source" varchar(16) NOT NULL DEFAULT 'product',
        "locale" varchar(8) NOT NULL DEFAULT 'es',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_axis_appointment" PRIMARY KEY ("id"),
        CONSTRAINT "FK_axis_appointment_product" FOREIGN KEY ("productId")
          REFERENCES "axis_product"("id") ON DELETE SET NULL
      )
    `)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_axis_appointment_product" ON "axis_appointment" ("productId")`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_axis_appointment_phone" ON "axis_appointment" ("phone")`,
    )
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_axis_appointment_status" ON "axis_appointment" ("status")`,
    )

    // Snapshot de la fórmula en la línea del pedido.
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" ADD COLUMN IF NOT EXISTS "prescriptionRx" jsonb`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" ADD COLUMN IF NOT EXISTS "prescriptionRxType" varchar(16)`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" ADD COLUMN IF NOT EXISTS "prescriptionIndex" varchar(8)`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item"
         ADD COLUMN IF NOT EXISTS "prescriptionEstimated" boolean NOT NULL DEFAULT false`,
    )

    /**
     * El complemento de fórmula deja de ir "por confirmar".
     *
     * `priceOnQuote` significaba "no puedo anunciar este precio porque la
     * graduación llega después de comprar". Ya no llega después: se pregunta en
     * la ficha. El precio de graduar vive ahora en el lente (la matriz de
     * arriba), así que la fila del complemento vuelve a costar 0 de verdad —
     * "incluido en el precio del lente", no "gratis".
     */
    await queryRunner.query(`
      UPDATE "axis_lens_option"
      SET "priceOnQuote" = false,
          "extraPriceCop" = 0,
          "descriptionEs" = 'Montamos tus lentes con tu graduación. Te pedimos los datos aquí mismo y el precio se ajusta al instante.',
          "descriptionEn" = 'We fit your lenses to your prescription. Enter it here and the price updates instantly.'
      WHERE "kind" = 'prescription'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "axis_lens_option"
      SET "priceOnQuote" = true,
          "descriptionEs" = 'Montamos tus lentes con tu fórmula. Te pediremos los datos al finalizar la compra.',
          "descriptionEn" = 'We fit your lenses to your prescription. We will ask for the details at checkout.'
      WHERE "kind" = 'prescription'
    `)
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "prescriptionEstimated"`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "prescriptionIndex"`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "prescriptionRxType"`,
    )
    await queryRunner.query(`ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "prescriptionRx"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "axis_appointment"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "axis_lens_rx_price"`)
  }
}
