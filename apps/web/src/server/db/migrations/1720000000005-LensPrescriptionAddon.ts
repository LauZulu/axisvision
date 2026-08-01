import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * La fórmula médica deja de ser un "tipo de lente" y pasa a ser un complemento.
 *
 * Antes el configurador era UNA lista de 6 opciones excluyentes, y el modelo se
 * contradecía solo: la opción "Transitions" prometía "disponible con o sin
 * fórmula", pero al elegirla ya no había forma de pedir la fórmula — solo la
 * fila `formula-medica` la pedía, y elegirla descartaba Transitions.
 *
 * Ahora son dos preguntas independientes:
 *   - `axis_lens_option.kind = 'lens'`         → qué lente (excluyentes)
 *   - `axis_lens_option.kind = 'prescription'` → ¿con tu fórmula? (se suma)
 *
 * La fila `formula-medica` se convierte en el complemento y se le cambia el
 * texto (era el nombre de un lente, ahora es la etiqueta de una casilla).
 * `transparente` pierde el "sin fórmula" del nombre: ya no aplica, porque
 * cualquier lente puede ir graduado.
 *
 * En `axis_order_item` la fórmula gana columnas propias para que el snapshot
 * del pedido distinga qué parte del precio fue el lente y qué parte la fórmula.
 */
export class LensPrescriptionAddon1720000000005 implements MigrationInterface {
  name = 'LensPrescriptionAddon1720000000005'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "axis_lens_option" ADD COLUMN IF NOT EXISTS "kind" varchar(16) NOT NULL DEFAULT 'lens'`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" ADD COLUMN IF NOT EXISTS "prescriptionOptionId" uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" ADD COLUMN IF NOT EXISTS "prescriptionOptionName" varchar(120)`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" ADD COLUMN IF NOT EXISTS "prescriptionExtraPriceCop" integer NOT NULL DEFAULT 0`,
    )

    // Los pedidos ya existentes con lente graduado: lo que se cobró de más era
    // la fórmula, no el lente. Se reclasifica para no perder la trazabilidad.
    await queryRunner.query(`
      UPDATE "axis_order_item" AS oi
      SET "prescriptionOptionId" = oi."lensOptionId",
          "prescriptionOptionName" = oi."lensOptionName",
          "prescriptionExtraPriceCop" = oi."lensExtraPriceCop",
          "lensOptionId" = NULL,
          "lensOptionName" = NULL,
          "lensExtraPriceCop" = 0
      FROM "axis_lens_option" AS lo
      WHERE lo."id" = oi."lensOptionId" AND lo."slug" = 'formula-medica'
    `)

    // La opción de fórmula pasa a ser el complemento (y deja de ser un lente).
    await queryRunner.query(`
      UPDATE "axis_lens_option"
      SET "kind" = 'prescription',
          "requiresPrescription" = true,
          "isDefault" = false,
          "imageVariant" = NULL,
          "nameEs" = 'Con tu fórmula médica',
          "nameEn" = 'With your prescription',
          "descriptionEs" = 'Montamos tu fórmula con nuestra óptica aliada, sobre el lente que elijas. Nos la envías después de comprar.',
          "descriptionEn" = 'We fit your prescription on the lens you picked, with our partner optician. You send it after purchase.'
      WHERE "slug" = 'formula-medica'
    `)

    await queryRunner.query(`
      UPDATE "axis_lens_option"
      SET "nameEs" = 'Lente transparente',
          "nameEn" = 'Clear lens',
          "descriptionEs" = 'Sin filtro de sol, para llevar AXIS todo el día.',
          "descriptionEn" = 'No sun filter, to wear AXIS all day.'
      WHERE "slug" = 'transparente'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Devuelve la fórmula a la columna del lente antes de perder las columnas.
    await queryRunner.query(`
      UPDATE "axis_order_item"
      SET "lensOptionId" = COALESCE("lensOptionId", "prescriptionOptionId"),
          "lensOptionName" = COALESCE("lensOptionName", "prescriptionOptionName"),
          "lensExtraPriceCop" = "lensExtraPriceCop" + "prescriptionExtraPriceCop"
      WHERE "prescriptionOptionId" IS NOT NULL
    `)
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "prescriptionOptionName"`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "prescriptionExtraPriceCop"`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "prescriptionOptionId"`,
    )
    await queryRunner.query(`ALTER TABLE "axis_lens_option" DROP COLUMN IF EXISTS "kind"`)
  }
}
