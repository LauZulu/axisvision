import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Reservas / lista de espera (`axis_stock_alert`).
 *
 * Guarda el correo de quien quiere que le avisemos cuando un modelo vuelva a
 * estar disponible — o cuando la tienda abra pagos, si todavía no lo están.
 *
 * El índice único (productId, email) es el que impide mandar dos correos a la
 * misma persona por el mismo modelo: al volver a apuntarse se reactiva la fila
 * existente en vez de insertar otra.
 */
export class StockAlerts1720000000004 implements MigrationInterface {
  name = 'StockAlerts1720000000004'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "axis_stock_alert" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "productId" uuid NOT NULL,
        "email" varchar(255) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'active',
        "source" varchar(16) NOT NULL DEFAULT 'sold_out',
        "locale" varchar(8) NOT NULL DEFAULT 'es',
        "token" varchar(64) NOT NULL,
        "verifiedAt" TIMESTAMP WITH TIME ZONE,
        "notifiedAt" TIMESTAMP WITH TIME ZONE,
        "unsubscribedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_axis_stock_alert" PRIMARY KEY ("id"),
        CONSTRAINT "FK_axis_stock_alert_product" FOREIGN KEY ("productId")
          REFERENCES "axis_product"("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_axis_stock_alert_product_email" ON "axis_stock_alert" ("productId", "email")`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_axis_stock_alert_token" ON "axis_stock_alert" ("token")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_axis_stock_alert_product" ON "axis_stock_alert" ("productId")`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_axis_stock_alert_status" ON "axis_stock_alert" ("status")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "axis_stock_alert"`)
  }
}
