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
 * Foto de producto INDEXADA: `position` define el orden dentro del producto.
 * Hoy `imageKey` es una clave de asset local (catálogo de prueba, imágenes
 * repetidas); en el futuro será una URL de S3 (mismo campo, ver assets.ts).
 */
@Entity({ name: 'axis_product_image' })
@Index(['productId', 'position'])
export class AxisProductImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  productId!: string

  @ManyToOne('AxisProduct', 'images', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: AxisProduct

  // Clave de asset local (p. ej. "product-onyx-front") o URL de S3.
  @Column({ type: 'varchar', length: 512 })
  imageKey!: string

  // Índice de orden de la foto (0 = principal).
  @Column({ type: 'integer', default: 0 })
  position!: number

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
