import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * La reserva guarda CÓMO quiere las gafas, no solo cuál.
 *
 * Con la tienda en preview (o el modelo agotado) no hay compra que cerrar, así
 * que el configurador vuelve a ser lo que era: una casilla. Pero la persona ya
 * eligió lente y antirreflejo antes de llegar al formulario, y esa elección se
 * estaba tirando a la basura — la reserva solo apuntaba el modelo. El día que
 * se abre la tienda o llega el stock, alguien tiene que escribirle, y no es lo
 * mismo "ya llegó tu Origin" que "ya llegó tu Origin, la que querías con
 * transitions y fórmula".
 *
 * Tres datos y ni uno más. **La graduación NO se guarda aquí a propósito**: una
 * fórmula médica caduca (menos de un año), y entre la reserva y la reposición
 * pueden pasar meses. Guardar diez cifras clínicas que habrá que volver a pedir
 * es fricción sin contrapartida y un dato sensible envejeciendo en la base. Lo
 * que se guarda es lo que no caduca: qué lente, con fórmula o sin ella, con
 * antirreflejo o sin él.
 *
 * `lensOptionId` va con `ON DELETE SET NULL` y no `CASCADE`: borrar una opción
 * del catálogo no puede llevarse por delante la reserva de una persona.
 */
export class WaitlistLensChoice1720000000013 implements MigrationInterface {
  name = 'WaitlistLensChoice1720000000013'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "axis_stock_alert" ADD COLUMN IF NOT EXISTS "lensOptionId" uuid`,
    )
    await queryRunner.query(`
      ALTER TABLE "axis_stock_alert"
        ADD CONSTRAINT "FK_axis_stock_alert_lens_option"
        FOREIGN KEY ("lensOptionId") REFERENCES "axis_lens_option"("id") ON DELETE SET NULL
    `)
    await queryRunner.query(
      `ALTER TABLE "axis_stock_alert"
         ADD COLUMN IF NOT EXISTS "withCoating" boolean NOT NULL DEFAULT false`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_stock_alert"
         ADD COLUMN IF NOT EXISTS "withPrescription" boolean NOT NULL DEFAULT false`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "axis_stock_alert" DROP CONSTRAINT IF EXISTS "FK_axis_stock_alert_lens_option"`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_stock_alert" DROP COLUMN IF EXISTS "withPrescription"`,
    )
    await queryRunner.query(`ALTER TABLE "axis_stock_alert" DROP COLUMN IF EXISTS "withCoating"`)
    await queryRunner.query(`ALTER TABLE "axis_stock_alert" DROP COLUMN IF EXISTS "lensOptionId"`)
  }
}
