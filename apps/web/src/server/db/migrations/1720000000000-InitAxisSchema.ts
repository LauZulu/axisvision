import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Esquema inicial de AXIS. SQL explícito y revisado a mano: crea SOLO tablas con
 * prefijo `axis_` y no toca nada existente en la RDS compartida. Identificadores
 * en camelCase → van entre comillas (así los nombra TypeORM por defecto).
 *
 * UUID por `gen_random_uuid()` (core de Postgres 13+). timestamptz con `now()`.
 */
export class InitAxisSchema1720000000000 implements MigrationInterface {
  name = 'InitAxisSchema1720000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Usuarios ---
    await queryRunner.query(`
      CREATE TABLE "axis_user" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL,
        "password" varchar(255) NOT NULL,
        "name" varchar(120),
        "phone" varchar(40),
        "role" varchar(16) NOT NULL DEFAULT 'user',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_axis_user" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_axis_user_email" ON "axis_user" ("email")`,
    )

    // --- Productos ---
    await queryRunner.query(`
      CREATE TABLE "axis_product" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" varchar(120) NOT NULL,
        "name" varchar(120) NOT NULL,
        "taglineEs" varchar(200) NOT NULL,
        "taglineEn" varchar(200) NOT NULL,
        "descriptionEs" text NOT NULL,
        "descriptionEn" text NOT NULL,
        "priceCop" integer NOT NULL,
        "currency" varchar(8) NOT NULL DEFAULT 'COP',
        "stock" integer NOT NULL DEFAULT 0,
        "active" boolean NOT NULL DEFAULT true,
        "position" integer NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_axis_product" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_axis_product_slug" ON "axis_product" ("slug")`,
    )

    // --- Fotos de producto (indexadas por position) ---
    await queryRunner.query(`
      CREATE TABLE "axis_product_image" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "productId" uuid NOT NULL,
        "imageKey" varchar(512) NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_axis_product_image" PRIMARY KEY ("id"),
        CONSTRAINT "FK_axis_product_image_product" FOREIGN KEY ("productId")
          REFERENCES "axis_product" ("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_axis_product_image_pos" ON "axis_product_image" ("productId", "position")`,
    )

    // --- Pedidos / ventas ---
    await queryRunner.query(`
      CREATE TABLE "axis_order" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "reference" varchar(64) NOT NULL,
        "userId" uuid,
        "customerName" varchar(120) NOT NULL,
        "customerEmail" varchar(255) NOT NULL,
        "customerPhone" varchar(40),
        "shipping" jsonb,
        "amountCop" integer NOT NULL,
        "currency" varchar(8) NOT NULL DEFAULT 'COP',
        "status" varchar(16) NOT NULL DEFAULT 'pending',
        "wompiTransactionId" varchar(128),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_axis_order" PRIMARY KEY ("id"),
        CONSTRAINT "FK_axis_order_user" FOREIGN KEY ("userId")
          REFERENCES "axis_user" ("id") ON DELETE SET NULL
      )
    `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_axis_order_reference" ON "axis_order" ("reference")`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_axis_order_user" ON "axis_order" ("userId")`)
    await queryRunner.query(
      `CREATE INDEX "IDX_axis_order_email" ON "axis_order" ("customerEmail")`,
    )

    // --- Líneas de pedido (snapshot de nombre/precio) ---
    await queryRunner.query(`
      CREATE TABLE "axis_order_item" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL,
        "productId" uuid,
        "productName" varchar(120) NOT NULL,
        "unitPriceCop" integer NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_axis_order_item" PRIMARY KEY ("id"),
        CONSTRAINT "FK_axis_order_item_order" FOREIGN KEY ("orderId")
          REFERENCES "axis_order" ("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(
      `CREATE INDEX "IDX_axis_order_item_order" ON "axis_order_item" ("orderId")`,
    )

    // --- Favoritos (usuario con cuenta) ---
    await queryRunner.query(`
      CREATE TABLE "axis_favorite" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_axis_favorite" PRIMARY KEY ("id"),
        CONSTRAINT "FK_axis_favorite_user" FOREIGN KEY ("userId")
          REFERENCES "axis_user" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_axis_favorite_product" FOREIGN KEY ("productId")
          REFERENCES "axis_product" ("id") ON DELETE CASCADE
      )
    `)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_axis_favorite" ON "axis_favorite" ("userId", "productId")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "axis_favorite"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "axis_order_item"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "axis_order"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "axis_product_image"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "axis_product"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "axis_user"`)
  }
}
