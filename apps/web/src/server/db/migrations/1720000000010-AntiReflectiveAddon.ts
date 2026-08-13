import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * El antirreflejo pasa de ser un lente a ser un COMPLEMENTO: se puede añadir a
 * cualquier tipo de lente, como la fórmula. Deshace el modelo de la migración
 * 009 (que lo metía como una opción excluyente más).
 *
 * Pero su precio NO es el mismo sobre cada lente, y ese es todo el motivo de
 * este diseño. En la lista del laboratorio 2026 conviven las dos versiones del
 * mismo lente:
 *
 *   1,5 BLANCO          90.000  →  1,5 AR        110.000   (+20.000)
 *   1,5 PHOTOCROMATICO 220.000  →  1,5 PHOTO AR  290.000   (+70.000)
 *   1,5 AR BLUE        150.000  →  ya lo trae puesto
 *
 * Un complemento de precio único —"antirreflejo +20.000"— habría vendido el
 * fotocromático con AR por 240.000 cuando cuesta 290.000, y habría cobrado un
 * tratamiento que el AR BLUE ya incluye. Por eso el precio del antirreflejo
 * vive en el LENTE (`arExtraPriceCop`), no en la fila del complemento:
 *
 *   número → lo que cuesta añadírselo a ese lente
 *   NULL   → ese lente ya lo trae (se muestra incluido, no se cobra)
 *
 * `transitions` vuelve a su renglón sin tratamiento (220.000): antes estaba
 * cargado con el precio del PHOTO AR, que ahora se alcanza sumando el AR.
 */
export class AntiReflectiveAddon1720000000010 implements MigrationInterface {
  name = 'AntiReflectiveAddon1720000000010'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "axis_lens_option"
         ADD COLUMN IF NOT EXISTS "arExtraPriceCop" integer`,
    )

    // Snapshot del antirreflejo en la línea del pedido, igual que el lente y la
    // fórmula: lo cobrado no puede depender de una fila que se edite después.
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" ADD COLUMN IF NOT EXISTS "coatingOptionId" uuid`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" ADD COLUMN IF NOT EXISTS "coatingOptionName" varchar(120)`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item"
         ADD COLUMN IF NOT EXISTS "coatingExtraPriceCop" integer NOT NULL DEFAULT 0`,
    )

    // Precio del antirreflejo POR LENTE. El polarizado y el tinte amarillo no
    // tienen renglón "con AR" en la lista: se les pone el mismo delta del
    // blanco (+20.000) hasta que el laboratorio confirme — está en PENDIENTES.
    const ar: Array<[string, number | null]> = [
      ['sol-polarizado', 20_000],
      ['transitions', 70_000],
      ['transparente', 20_000],
      ['filtro-azul', null], // 1,5 AR BLUE ya lo trae
      ['filtro-amarillo', 20_000],
    ]
    for (const [slug, price] of ar) {
      await queryRunner.query(
        `UPDATE "axis_lens_option" SET "arExtraPriceCop" = $1 WHERE "slug" = $2 AND "kind" = 'lens'`,
        [price, slug],
      )
    }

    // Transitions vuelve al renglón SIN tratamiento: el AR ya no va dentro.
    await queryRunner.query(`
      UPDATE "axis_lens_option"
      SET "extraPriceCop" = 220000,
          "descriptionEs" = 'Se oscurece con el sol y se aclara en interiores.',
          "descriptionEn" = 'Darkens in the sun, clears indoors.'
      WHERE "slug" = 'transitions'
    `)

    // El transparente vuelve a su sitio en la rejilla (la 009 lo había partido
    // en dos filas para meter el AR al lado).
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "position" = 4 WHERE "slug" = 'filtro-azul'`,
    )
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "position" = 5 WHERE "slug" = 'filtro-amarillo'`,
    )

    // La fila que la 009 creó como lente se reconvierte en complemento. Se
    // reaprovecha en vez de borrarla e insertar otra: mantiene su id, y con él
    // la fila de `axis_product_lens_option` que la asigna a cada modelo.
    await queryRunner.query(
      `
      UPDATE "axis_lens_option"
      SET "kind" = 'coating',
          "nameEs" = $1,
          "nameEn" = $2,
          "descriptionEs" = $3,
          "descriptionEn" = $4,
          "extraPriceCop" = 0,
          "arExtraPriceCop" = NULL,
          "imageVariant" = NULL,
          "position" = 9
      WHERE "slug" = 'antirreflejo'
    `,
      [
        'Antirreflejo',
        'Anti-reflective coating',
        'Menos brillos de pantallas, faros y luz artificial. Se puede montar sobre cualquiera de los lentes, y la mirada se te ve.',
        'Fewer reflections from screens, headlights and artificial light. It can go on any of the lenses, and your eyes stay visible.',
      ],
    )

    // Si la 009 no llegó a correr (base nueva), la fila no existe: se crea.
    await queryRunner.query(
      `
      INSERT INTO "axis_lens_option"
        ("slug", "kind", "nameEs", "nameEn", "descriptionEs", "descriptionEn",
         "extraPriceCop", "priceOnQuote", "requiresPrescription", "isDefault",
         "active", "position", "imageVariant")
      VALUES ('antirreflejo', 'coating', $1, $2, $3, $4, 0, false, false, false, true, 9, NULL)
      ON CONFLICT ("slug") DO NOTHING
    `,
      [
        'Antirreflejo',
        'Anti-reflective coating',
        'Menos brillos de pantallas, faros y luz artificial. Se puede montar sobre cualquiera de los lentes, y la mirada se te ve.',
        'Fewer reflections from screens, headlights and artificial light. It can go on any of the lenses, and your eyes stay visible.',
      ],
    )

    // Apex lista sus opciones de forma explícita (es la única excepción), así
    // que una opción nueva le queda fuera sola. Aquí eso sería justo lo
    // contrario de lo que dice el complemento: el antirreflejo no está reñido
    // con ningún lente. Se le añade a todo modelo que tenga lista propia.
    await queryRunner.query(`
      INSERT INTO "axis_product_lens_option" ("productId", "lensOptionId", "position")
      SELECT DISTINCT pl."productId", ar."id", 9
      FROM "axis_product_lens_option" pl
      CROSS JOIN (SELECT "id" FROM "axis_lens_option" WHERE "slug" = 'antirreflejo') ar
      ON CONFLICT ("productId", "lensOptionId") DO NOTHING
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "axis_product_lens_option"
      WHERE "lensOptionId" IN (SELECT "id" FROM "axis_lens_option" WHERE "slug" = 'antirreflejo')
    `)
    // Vuelve a ser el lente transparente con AR de la migración 009.
    await queryRunner.query(
      `
      UPDATE "axis_lens_option"
      SET "kind" = 'lens',
          "nameEs" = $1,
          "nameEn" = $2,
          "extraPriceCop" = 110000,
          "imageVariant" = 'ophthalmic',
          "position" = 4
      WHERE "slug" = 'antirreflejo'
    `,
      ['Lente transparente con antirreflejo', 'Clear lens with anti-reflective coating'],
    )
    await queryRunner.query(`
      UPDATE "axis_lens_option"
      SET "extraPriceCop" = 290000,
          "descriptionEs" = 'Se oscurece con el sol y se aclara en interiores. Ya viene con antirreflejo.',
          "descriptionEn" = 'Darkens in the sun, clears indoors. Anti-reflective coating included.'
      WHERE "slug" = 'transitions'
    `)
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "position" = 5 WHERE "slug" = 'filtro-azul'`,
    )
    await queryRunner.query(
      `UPDATE "axis_lens_option" SET "position" = 6 WHERE "slug" = 'filtro-amarillo'`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "coatingExtraPriceCop"`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "coatingOptionName"`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_order_item" DROP COLUMN IF EXISTS "coatingOptionId"`,
    )
    await queryRunner.query(
      `ALTER TABLE "axis_lens_option" DROP COLUMN IF EXISTS "arExtraPriceCop"`,
    )
  }
}
