import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Precios reales de los lentes (lista del laboratorio 2026) y precio "por
 * confirmar" para la fórmula médica.
 *
 * Hasta ahora las cinco opciones valían 10.000 COP: un placeholder que puso el
 * import de inventario cuando todavía no había lista de precios. Este es el
 * precio del lente PLANO (sin graduación), que es lo que el cliente paga en el
 * checkout:
 *
 *   transparente     1,5 AR             110.000
 *   filtro-azul      1,5 AR BLUE        150.000
 *   filtro-amarillo  1,5 COLOR          150.000
 *   transitions      1,5 PHOTO AR       290.000
 *   sol-polarizado   —                        0  (viene montado con la gafa)
 *
 * `priceOnQuote` es la parte que no es cosmética. Con fórmula médica esos
 * precios son la BASE: el valor final depende de la graduación (a más dioptrías,
 * índice más alto y tallado en vez de terminado), y esa graduación NO se conoce
 * al cobrar — el cliente manda la fórmula después de comprar. Así que la fila de
 * fórmula pasa a valer 0 y se marca como "por confirmar".
 *
 * Sin la bandera no habría forma de distinguirla de una opción gratis: todo el
 * front pinta `extraPriceCop === 0` como "Incluido", o sea que la ficha habría
 * prometido el montaje de la fórmula sin costo. Eso es peor que un precio
 * equivocado, porque es una promesa.
 *
 * Los precios son editables desde /admin/lentes; esta migración solo pone el
 * punto de partida.
 */
export class LensPricesOnQuote1720000000008 implements MigrationInterface {
  name = 'LensPricesOnQuote1720000000008'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "axis_lens_option"
         ADD COLUMN IF NOT EXISTS "priceOnQuote" boolean NOT NULL DEFAULT false`,
    )

    // Precio de venta del lente plano. Se pisan los placeholders de 10.000.
    const prices: Array<[string, number]> = [
      ['sol-polarizado', 0],
      ['transparente', 110_000],
      ['filtro-azul', 150_000],
      ['filtro-amarillo', 150_000],
      ['transitions', 290_000],
    ]
    for (const [slug, price] of prices) {
      await queryRunner.query(
        `UPDATE "axis_lens_option" SET "extraPriceCop" = $1 WHERE "slug" = $2 AND "kind" = 'lens'`,
        [price, slug],
      )
    }

    // La fórmula no se cobra en el checkout: se cotiza al recibirla.
    await queryRunner.query(`
      UPDATE "axis_lens_option"
      SET "priceOnQuote" = true,
          "extraPriceCop" = 0,
          "descriptionEs" = 'Montamos tu fórmula con nuestra óptica aliada, sobre el lente que elijas. Nos la envías después de comprar y te confirmamos el valor.',
          "descriptionEn" = 'We fit your prescription on the lens you picked, with our partner optician. You send it after purchase and we confirm the price.'
      WHERE "kind" = 'prescription'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Vuelve al placeholder anterior: no había otro precio que restaurar.
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "extraPriceCop" = 10000 WHERE "slug" <> 'sol-polarizado'`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_lens_option" DROP COLUMN IF EXISTS "priceOnQuote"`,
    )
  }
}
