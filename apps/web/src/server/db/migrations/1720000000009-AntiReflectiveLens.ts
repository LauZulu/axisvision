import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * El antirreflejo, como opción que el cliente puede elegir.
 *
 * En la lista del laboratorio 2026 el antirreflejo NO es un lente aparte: es lo
 * que separa dos renglones del mismo lente.
 *
 *   1,5 BLANCO   90.000   ← transparente sin tratamiento
 *   1,5 AR      110.000   ← el mismo, con antirreflejo   (+20.000)
 *
 * Por eso no se modela como un complemento global tipo la fórmula: el resto de
 * lentes de la lista YA lo llevan puesto (AR BLUE, PHOTO AR), y un complemento
 * que se suma a todo cobraría dos veces por el mismo tratamiento. Donde el
 * antirreflejo es de verdad una decisión es en el lente transparente, así que
 * son dos opciones excluyentes: el transparente pelado y el transparente con
 * antirreflejo.
 *
 * Consecuencia: `transparente` baja a 90.000 (el renglón BLANCO, que es lo que
 * de verdad es un transparente sin tratamiento; antes estaba cargado con el
 * precio del AR) y el AR entra como opción propia a 110.000.
 *
 * Qué modelos lo ofrecen: todos menos Apex. No hace falta tocar
 * `axis_product_lens_option` — Apex es la única excepción y lista sus opciones
 * de forma explícita, así que una opción nueva le queda fuera sola; el resto no
 * tiene filas, y "sin filas" significa "las ofrece todas".
 */
export class AntiReflectiveLens1720000000009 implements MigrationInterface {
  name = 'AntiReflectiveLens1720000000009'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Hueco para el antirreflejo justo detrás del transparente: son las dos
    // caras de la misma decisión y separarlos en la rejilla las esconde.
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "position" = 5 WHERE "slug" = 'filtro-azul'`,
    )
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "position" = 6 WHERE "slug" = 'filtro-amarillo'`,
    )

    // El transparente vuelve a su renglón real: 1,5 BLANCO, sin tratamiento.
    await queryRunner.query(`
      UPDATE "axis_lens_option"
      SET "extraPriceCop" = 90000,
          "descriptionEs" = 'Sin filtro de sol, para llevar AXIS todo el día. Sin tratamiento antirreflejo.',
          "descriptionEn" = 'No sun filter, to wear AXIS all day. Without anti-reflective coating.'
      WHERE "slug" = 'transparente'
    `)

    await queryRunner.query(
      `
      INSERT INTO "axis_lens_option"
        ("slug", "kind", "nameEs", "nameEn", "descriptionEs", "descriptionEn",
         "extraPriceCop", "priceOnQuote", "requiresPrescription", "isDefault",
         "active", "position", "imageVariant")
      VALUES
        ('antirreflejo', 'lens', $1, $2, $3, $4, 110000, false, false, false, true, 4, 'ophthalmic')
      ON CONFLICT ("slug") DO NOTHING
    `,
      [
        'Lente transparente con antirreflejo',
        'Clear lens with anti-reflective coating',
        'El transparente con tratamiento antirreflejo: menos brillos de pantallas, faros y luz artificial, y la mirada se te ve.',
        'The clear lens with an anti-reflective coating: fewer reflections from screens, headlights and artificial light — and your eyes stay visible.',
      ],
    )

    // Los lentes que ya traen antirreflejo de fábrica lo dicen, o el cliente
    // busca dónde añadírselo y acaba pensando que se lo estamos escatimando.
    await queryRunner.query(`
      UPDATE "axis_lens_option"
      SET "descriptionEs" = 'Lente transparente con filtro para pantallas. Para uso en interiores. Ya viene con antirreflejo.',
          "descriptionEn" = 'Clear lens with a screen filter. For indoor use. Anti-reflective coating included.'
      WHERE "slug" = 'filtro-azul'
    `)
    await queryRunner.query(`
      UPDATE "axis_lens_option"
      SET "descriptionEs" = 'Se oscurece con el sol y se aclara en interiores. Ya viene con antirreflejo.',
          "descriptionEn" = 'Darkens in the sun, clears indoors. Anti-reflective coating included.'
      WHERE "slug" = 'transitions'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "axis_lens_option" WHERE "slug" = 'antirreflejo'`)
    await queryRunner.query(`
      UPDATE "axis_lens_option"
      SET "extraPriceCop" = 110000,
          "descriptionEs" = 'Sin filtro de sol, para llevar AXIS todo el día.',
          "descriptionEn" = 'No sun filter, to wear AXIS all day.'
      WHERE "slug" = 'transparente'
    `)
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "position" = 4 WHERE "slug" = 'filtro-azul'`,
    )
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "position" = 5 WHERE "slug" = 'filtro-amarillo'`,
    )
  }
}
