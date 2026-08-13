import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * La reserva pasa a pedir NOMBRE y WHATSAPP; el correo queda opcional.
 *
 * Antes la lista de espera era una lista de correos y el correo era la
 * identidad de la fila. Ahora la identidad es el TELÉFONO: es el dato que se
 * pide siempre, y es por donde se avisa a quien no deja correo.
 *
 * Tres decisiones que no son obvias:
 *
 *  1. `name` y `phone` entran NULL-ables aunque el formulario los exija. Las
 *     filas que ya existen se dieron de alta con un formulario que solo pedía
 *     correo: no hay forma honesta de rellenarles un teléfono, y un
 *     `DEFAULT ''` los volvería a todos "la misma persona" para el índice
 *     único. Prefiero que la fila diga la verdad —"esta se capturó sin
 *     teléfono"— y que la exigencia viva en el API, que es donde entra el dato
 *     nuevo.
 *  2. `email` deja de ser NOT NULL. En Postgres los NULL son distintos entre sí
 *     dentro de un índice único, así que `UQ_axis_stock_alert_product_email`
 *     sigue en pie sin estorbar: varias reservas sin correo conviven, y dos con
 *     el mismo correo para el mismo modelo siguen siendo imposibles.
 *  3. El nuevo índice único (productId, phone) es el que impide que la misma
 *     persona quede apuntada dos veces al mismo modelo, que es justo lo que
 *     hacía el de correo cuando el correo era obligatorio.
 */
export class WaitlistNamePhone1720000000011 implements MigrationInterface {
  name = 'WaitlistNamePhone1720000000011'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "axis_stock_alert" ADD COLUMN "name" varchar(120)`)
    await queryRunner.query(`ALTER TABLE "axis_stock_alert" ADD COLUMN "phone" varchar(24)`)
    await queryRunner.query(`ALTER TABLE "axis_stock_alert" ALTER COLUMN "email" DROP NOT NULL`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_axis_stock_alert_product_phone" ON "axis_stock_alert" ("productId", "phone")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_axis_stock_alert_product_phone"`)
    // Volver a NOT NULL solo es posible si no quedaron reservas sin correo:
    // son las que nacieron con este cambio y no hay dato con el que inventarlo.
    await queryRunner.query(`DELETE FROM "axis_stock_alert" WHERE "email" IS NULL`)
    await queryRunner.query(`ALTER TABLE "axis_stock_alert" ALTER COLUMN "email" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "axis_stock_alert" DROP COLUMN "phone"`)
    await queryRunner.query(`ALTER TABLE "axis_stock_alert" DROP COLUMN "name"`)
  }
}
