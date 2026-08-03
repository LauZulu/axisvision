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

/** Con qué lente se tomó la foto. `null` = sirve para cualquiera. */
export type ImageLensVariant = 'sunglass' | 'ophthalmic' | 'yellow'

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

  // Índice de orden de la foto (0 = principal).
  @Column({ type: 'integer', default: 0 })
  position!: number

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
