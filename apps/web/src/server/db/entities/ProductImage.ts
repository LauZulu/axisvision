import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import type { AxisProduct } from './Product'

/**
 * Con qué lente se tomó la foto. `null` = sirve para cualquiera.
 *
 * `transitions` y `blue` no tienen ni una foto: existen para que esas dos
 * opciones NO compartan variante con el lente transparente. Compartiéndola, la
 * regla "si hay foto real de tu variante, manda la foto real" les daba las
 * fotos del lente claro y nunca llegaban a teñirse (ver migración 014).
 */
export type ImageLensVariant = 'sunglass' | 'ophthalmic' | 'yellow' | 'transitions' | 'blue'

/**
 * Foto de producto INDEXADA: `position` define el orden dentro del producto.
 * `imageKey` es la clave en S3 (`products/<slug>/<variante>/<categoria>-NN.jpg`);
 * el frontend la resuelve a URL de CloudFront.
 */
@Entity({ name: 'axis_product_image' })
@Index(['productId', 'position'])
export class AxisProductImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  productId!: string

  // Por NOMBRE DE TABLA, no de clase: la minificación del build de producción
  // renombra las clases y rompe la resolución (ver la nota en Product.ts).
  @ManyToOne('axis_product', 'images', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: AxisProduct

  // Clave en S3 (o clave de asset local en el catálogo de prueba antiguo).
  @Column({ type: 'varchar', length: 512 })
  imageKey!: string

  // Lente con el que se fotografió. Las fotos sin variante (estuche, empaque,
  // accesorios) se muestran siempre, elija lo que elija el cliente.
  @Column({ type: 'varchar', length: 24, nullable: true })
  lensVariant!: ImageLensVariant | null

  /**
   * Silueta del LENTE en esta foto, como `data:` URI de un WebP alfa de 160px
   * (≈1,2 KB). Con ella la tienda pinta encima una capa de color y una sola
   * foto sirve para todos los tipos de lente, sin generar ni descargar
   * variantes. La extrae `pnpm images:masks`.
   *
   * `null` = esta foto no se puede teñir, y es el caso normal: teñir es
   * `multiply`, o sea que solo oscurece, así que únicamente sirve sobre una
   * foto de lente TRANSPARENTE. Tener máscara es el permiso para simular.
   *
   * Va incrustada aquí y no como objeto en S3 porque `mask-image` pasa por
   * CORS y CloudFront no manda `Access-Control-Allow-Origin` en GET: servida
   * desde el CDN, la capa se bloquea y desaparece entera.
   */
  @Column({ type: 'text', nullable: true })
  lensMask!: string | null

  // Índice de orden de la foto (0 = principal).
  @Column({ type: 'integer', default: 0 })
  position!: number

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
