import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Fase 7 (Wompi) + descuentos. Solo ADD COLUMN sobre tablas axis_* existentes:
 *  - axis_product.compareAtPriceCop: precio "anterior" para mostrar descuento.
 *  - axis_order.paymentMethodType / paidAt: datos del pago confirmado por webhook.
 */
export class WompiAndDiscounts1720000000001 implements MigrationInterface {
  name = 'WompiAndDiscounts1720000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "axis_product" ADD COLUMN "compareAtPriceCop" integer`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order" ADD COLUMN "paymentMethodType" varchar(32)`,
    )
    await queryRunner.query(`ALTER TABLE "axis_order" ADD COLUMN "paidAt" timestamptz`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "axis_order" DROP COLUMN IF EXISTS "paidAt"`)
    await queryRunner.query(
      `ALTER TABLE "axis_order" DROP COLUMN IF EXISTS "paymentMethodType"`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_product" DROP COLUMN IF EXISTS "compareAtPriceCop"`,
    )
  }
}
