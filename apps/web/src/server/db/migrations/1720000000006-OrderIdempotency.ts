import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Clave de idempotencia del checkout (`axis_order.idempotencyKey`).
 *
 * Sin esto, dos clics en "pagar" crean DOS pedidos `pending` distintos, cada
 * uno con su propia referencia de Wompi. Consecuencias reales: el comprador
 * puede acabar pagando dos veces, el stock se descuenta dos veces, y el pedido
 * huérfano dispara el correo de "compra sin terminar" a alguien que sí compró.
 *
 * El navegador genera una clave por intento de compra y la repite en los
 * reenvíos; el índice único hace que el segundo INSERT choque y el servidor
 * devuelva el pedido que ya existía en vez de crear otro.
 *
 * Es NULLABLE porque los pedidos anteriores a esta migración no la tienen, y
 * porque en Postgres los NULL no colisionan entre sí en un índice único.
 */
export class OrderIdempotency1720000000006 implements MigrationInterface {
  name = 'OrderIdempotency1720000000006'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "axis_order" ADD COLUMN "idempotencyKey" varchar(64)`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_axis_order_idempotency" ON "axis_order" ("idempotencyKey")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_axis_order_idempotency"`)
    await queryRunner.query(`ALTER TABLE "axis_order" DROP COLUMN "idempotencyKey"`)
  }
}
